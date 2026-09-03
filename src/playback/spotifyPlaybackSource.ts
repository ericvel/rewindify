import { readonly, ref } from 'vue';
import { startPlayback } from '@/spotify/api';
import { DEVICE_NAME } from '@/spotify/config';
import { loadSpotifyPlayer, type SpotifyPlaybackState, type SpotifyPlayer } from '@/spotify/sdk';
import { getAccessToken } from '@/spotify/tokens';
import type { PlaybackSource, Track } from './types';

/** How long a device may take to register before a click gives up on it. */
const ATTACH_TIMEOUT_MS = 15_000;

/**
 * A seek is a round trip, so the SDK keeps reporting the old position for a
 * moment afterwards. States are held at arm's length until one lands near the
 * requested point — or until this long has passed, since a seek Spotify
 * silently dropped must not freeze the playhead forever.
 */
const SEEK_SETTLE_TOLERANCE_SECONDS = 0.75;
const SEEK_SETTLE_TIMEOUT_MS = 3000;

const PLAYER_EVENTS = [
  'ready',
  'not_ready',
  'player_state_changed',
  'initialization_error',
  'authentication_error',
  'account_error',
  'playback_error',
] as const;

interface Attached {
  player: SpotifyPlayer;
  deviceId: string;
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Spotify playback failed.';
}

/**
 * Playback through the Spotify Web Playback SDK.
 *
 * Two things about the SDK shape this. It cannot cue a track without starting
 * it, and browsers will not start audio away from a user gesture — so nothing is
 * sent to Spotify until the first press of play. Until then the track's own
 * metadata supplies the duration and the playhead is local, which is enough for
 * the timeline, the readouts and picking a loop before hearing a note.
 *
 * And the SDK reports a position only when something changes, so between events
 * the playhead is interpolated against a wall-clock anchor, as the mock did.
 * The loop needs a position that moves every frame; wrapping at B can only be
 * as accurate as the last thing Spotify said plus elapsed time.
 */
export function createSpotifyPlaybackSource(): PlaybackSource {
  const position = ref(0);
  const duration = ref(0);
  const isPlaying = ref(false);
  const isReady = ref(false);
  const error = ref<string | null>(null);

  let track: Track | null = null;
  /** The uri Spotify currently holds on our device, or null if nothing is cued. */
  let cuedUri: string | null = null;
  let attached: Attached | null = null;
  let attaching: Promise<Attached> | null = null;
  let pendingSeek: { target: number; expiresAt: number } | null = null;

  let frame: number | null = null;
  let anchorPosition = 0;
  let anchorTime = 0;

  function anchor(at: number) {
    anchorPosition = at;
    anchorTime = performance.now();
  }

  function tick() {
    const elapsed = (performance.now() - anchorTime) / 1000;
    position.value = Math.min(duration.value, anchorPosition + elapsed);
    frame = requestAnimationFrame(tick);
  }

  function startClock() {
    if (frame !== null) return;
    anchor(position.value);
    frame = requestAnimationFrame(tick);
  }

  function stopClock() {
    if (frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  }

  function setPlaying(next: boolean) {
    if (isPlaying.value === next) return;
    isPlaying.value = next;
    if (next) startClock();
    else stopClock();
  }

  function syncFromState(state: SpotifyPlaybackState | null) {
    // Null means this device is no longer the one playing — another Spotify
    // client took over, so nothing is cued here any more.
    if (state === null) {
      cuedUri = null;
      isReady.value = false;
      setPlaying(false);
      return;
    }

    // A state about some other track is a leftover from a switch in progress.
    // `cuedUri` is cleared before the old player is paused, so the selected
    // track remains the authority while that pause and its events settle.
    const playing = state.track_window.current_track;
    if (track !== null && playing !== null && playing.uri !== track.uri) return;

    if (state.duration > 0) duration.value = state.duration / 1000;
    const reported = state.position / 1000;

    // Spotify reports a paused player at position 0 when a single-track context
    // runs out. Believing it would snap the playhead to the start of a track the
    // listener just finished, so the end is held instead.
    const isContextEnd =
      state.paused && reported === 0 && duration.value > 0 && position.value >= duration.value - 1;
    if (isContextEnd) {
      cuedUri = null;
      setPlaying(false);
      return;
    }

    if (pendingSeek !== null) {
      const settled =
        Math.abs(reported - pendingSeek.target) <= SEEK_SETTLE_TOLERANCE_SECONDS ||
        performance.now() > pendingSeek.expiresAt;
      if (!settled) {
        setPlaying(!state.paused);
        return;
      }
      pendingSeek = null;
    }

    position.value = duration.value > 0 ? Math.min(duration.value, reported) : reported;
    anchor(position.value);
    setPlaying(!state.paused);
  }

  async function attach(): Promise<Attached> {
    const Player = await loadSpotifyPlayer();
    const player = new Player({
      name: DEVICE_NAME,
      // Called by the SDK whenever its own token is spent, which is why the
      // token store owns refreshing rather than any one caller.
      getOAuthToken: (callback) => {
        void getAccessToken()
          .then(callback)
          .catch((cause: unknown) => {
            error.value = describe(cause);
          });
      },
      volume: 1,
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const registered = new Promise<string>((resolve, reject) => {
      player.addListener('ready', ({ device_id }) => resolve(device_id));
      timer = setTimeout(
        () => reject(new Error('Spotify never registered a playback device.')),
        ATTACH_TIMEOUT_MS,
      );
    });

    player.addListener('not_ready', () => {
      isReady.value = false;
    });
    player.addListener('player_state_changed', syncFromState);
    player.addListener('initialization_error', ({ message }) => {
      error.value = message;
    });
    player.addListener('authentication_error', ({ message }) => {
      error.value = message;
    });
    player.addListener('account_error', () => {
      error.value = 'Spotify Premium is required to play in the browser.';
    });
    player.addListener('playback_error', ({ message }) => {
      error.value = message;
    });

    try {
      if (!(await player.connect())) throw new Error('Spotify refused the player connection.');
      const deviceId = await registered;
      attached = { player, deviceId };
      isReady.value = true;
      error.value = null;
      return attached;
    } catch (cause) {
      detach(player);
      throw cause;
    } finally {
      clearTimeout(timer);
    }
  }

  function detach(player: SpotifyPlayer) {
    for (const event of PLAYER_EVENTS) player.removeListener(event);
    player.disconnect();
    if (attached?.player === player) attached = null;
    isReady.value = false;
  }

  /** Memoised while it is working; a failed attach is retried on the next press. */
  function ensureAttached(): Promise<Attached> {
    attaching ??= attach().catch((cause: unknown) => {
      attaching = null;
      error.value = describe(cause);
      throw cause;
    });
    return attaching;
  }

  return {
    position: readonly(position),
    duration: readonly(duration),
    isPlaying: readonly(isPlaying),
    isReady: readonly(isReady),
    error: readonly(error),

    async load(next: Track) {
      stopClock();
      pendingSeek = null;
      error.value = null;
      track = next;
      duration.value = next.duration;
      position.value = 0;
      isPlaying.value = false;
      anchor(0);

      // Whatever is still sounding belongs to the track being left.
      const leaving = cuedUri !== null ? attached : null;
      cuedUri = null;
      if (leaving) await leaving.player.pause().catch(() => undefined);

      // Registering the device now rather than on the first press keeps that
      // press short: the closer the play call is to the gesture, the more
      // reliably a browser lets audio start.
      void ensureAttached().catch(() => undefined);
    },

    async play() {
      const current = track;
      if (current === null || isPlaying.value) return;

      try {
        const { player, deviceId } = await ensureAttached();
        // The SDK's audio element needs marking as user-activated, and only a
        // call made from inside a gesture counts.
        await player.activateElement().catch(() => undefined);

        if (cuedUri === current.uri) {
          await player.resume();
        } else {
          // Cueing starts at wherever the local playhead was left, so a loop
          // picked before pressing play is honoured on the first pass.
          const offset = position.value;
          await startPlayback(deviceId, current.uri, offset * 1000);
          cuedUri = current.uri;
          pendingSeek =
            offset > 0
              ? { target: offset, expiresAt: performance.now() + SEEK_SETTLE_TIMEOUT_MS }
              : null;
        }

        error.value = null;
        setPlaying(true);
      } catch (cause) {
        setPlaying(false);
        error.value = describe(cause);
      }
    },

    async pause() {
      setPlaying(false);
      if (attached === null || cuedUri === null) return;
      try {
        await attached.player.pause();
      } catch (cause) {
        error.value = describe(cause);
      }
    },

    async seek(seconds: number) {
      const target = Math.min(duration.value, Math.max(0, seconds));
      // Applied locally first: the loop wraps by seeking, and a playhead that
      // waited for the round trip would sail past B and ask to wrap again.
      position.value = target;
      anchor(target);

      // Nothing cued yet, so there is nothing to tell Spotify — the offset goes
      // out with the first play instead.
      if (cuedUri === null || attached === null) return;

      pendingSeek = { target, expiresAt: performance.now() + SEEK_SETTLE_TIMEOUT_MS };
      try {
        await attached.player.seek(target * 1000);
      } catch (cause) {
        error.value = describe(cause);
      }
    },

    dispose() {
      stopClock();
      isPlaying.value = false;
      pendingSeek = null;
      cuedUri = null;
      attaching = null;
      if (attached !== null) detach(attached.player);
    },
  };
}
