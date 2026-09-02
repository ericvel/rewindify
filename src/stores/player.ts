import { computed, onScopeDispose, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { createSpotifyPlaybackSource } from '@/playback/spotifyPlaybackSource';
import { IS_FAKE_SPOTIFY } from '@/fake/enabled';
import { createFakePlaybackSource } from '@/fake/fakePlaybackSource';
import { resolveLoopTransition } from '@/playback/loop';
import { formatTime } from '@/playback/time';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { useLibraryStore } from './library';
import { useSessionStore } from './session';
import type { Track } from '@/playback/types';

/** A loop shorter than this is unusable, and lets A and B swap past each other. */
export const MIN_LOOP_SECONDS = 2;

export type ScrubKind = 'head' | 'a' | 'b';
export type TimeDisplay = 'Remaining' | 'Total';

export interface LoopRequest {
  a?: number;
  b?: number;
  on?: boolean;
}

/** The loop a freshly picked track starts with. */
function defaultLoop(duration: number) {
  return { a: Math.min(30, duration * 0.2), b: Math.min(60, duration * 0.45) };
}

function clampLoop(a: number, b: number, duration: number) {
  const safeA = Math.min(Math.max(0, a), Math.max(0, duration - MIN_LOOP_SECONDS));
  const safeB = Math.min(duration, Math.max(b, safeA + MIN_LOOP_SECONDS));
  return { a: safeA, b: safeB };
}

export const usePlayerStore = defineStore('player', () => {
  const library = useLibraryStore();
  const session = useSessionStore();
  const source = IS_FAKE_SPOTIFY ? createFakePlaybackSource() : createSpotifyPlaybackSource();
  onScopeDispose(() => source.dispose());

  const currentTrack = ref<Track | null>(null);
  const loopOn = ref(true);
  const loopA = ref(0);
  const loopB = ref(0);

  const scrubKind = ref<ScrubKind | null>(null);
  const scrubValue = ref(0);

  const skipSeconds = useLocalStorage('rewindify:skipSeconds', 5);
  const timeDisplay = useLocalStorage<TimeDisplay>('rewindify:timeDisplay', 'Remaining');

  const duration = computed(() => source.duration.value);
  const isPlaying = computed(() => source.isPlaying.value);
  const isScrubbing = computed(() => scrubKind.value !== null);
  /** False until Spotify has registered this browser as a playback device. */
  const isReady = computed(() => source.isReady.value);
  const error = computed(() => source.error.value);

  /** Display values follow the pointer during a drag; committed state does not. */
  const position = computed(() =>
    scrubKind.value === 'head' ? scrubValue.value : source.position.value,
  );
  const displayLoopA = computed(() => (scrubKind.value === 'a' ? scrubValue.value : loopA.value));
  const displayLoopB = computed(() => (scrubKind.value === 'b' ? scrubValue.value : loopB.value));

  const nowLabel = computed(() => formatTime(position.value));
  const endLabel = computed(() =>
    timeDisplay.value === 'Total'
      ? formatTime(duration.value)
      : `−${formatTime(duration.value - position.value)}`,
  );
  const skipLabel = computed(() => `${skipSeconds.value}s`);

  /**
   * Loads a track at the start, paused, with the loop off unless the URL asks
   * for one: a shared link should neither autoplay nor drop you mid-track.
   * A and B still get sensible defaults so switching the loop on lands
   * somewhere useful.
   */
  async function loadTrack(track: Track, requested: LoopRequest = {}) {
    currentTrack.value = track;
    await source.load(track);

    const fallback = defaultLoop(track.duration);
    const clamped = clampLoop(requested.a ?? fallback.a, requested.b ?? fallback.b, track.duration);
    loopA.value = clamped.a;
    loopB.value = clamped.b;
    loopOn.value = requested.on ?? false;

    await source.seek(loopOn.value ? loopA.value : 0);
    library.markPlayed(track);
  }

  async function togglePlay() {
    if (isPlaying.value) await source.pause();
    else await source.play();
  }

  async function rewind() {
    const floor = loopOn.value ? loopA.value : 0;
    await source.seek(Math.max(floor, position.value - skipSeconds.value));
  }

  async function forward() {
    const ceiling = loopOn.value ? loopB.value : duration.value;
    await source.seek(Math.min(ceiling, position.value + skipSeconds.value));
  }

  function toggleLoop() {
    loopOn.value = !loopOn.value;
  }

  function setLoopPoint(point: 'a' | 'b', seconds: number) {
    const next =
      point === 'a'
        ? clampLoop(seconds, loopB.value, duration.value)
        : clampLoop(loopA.value, seconds, duration.value);
    loopA.value = next.a;
    loopB.value = next.b;
  }

  /** Nudging either end implies you want the loop, so it switches on. */
  function nudge(point: 'a' | 'b', by: number) {
    setLoopPoint(point, (point === 'a' ? loopA.value : loopB.value) + by);
    loopOn.value = true;
  }

  function markPoint(point: 'a' | 'b') {
    setLoopPoint(point, position.value);
    loopOn.value = true;
  }

  function beginScrub(kind: ScrubKind, fraction: number) {
    scrubKind.value = kind;
    updateScrub(fraction);
  }

  function updateScrub(fraction: number) {
    if (!scrubKind.value) return;
    const seconds = Math.min(1, Math.max(0, fraction)) * duration.value;
    if (scrubKind.value === 'a') {
      scrubValue.value = Math.min(seconds, loopB.value - MIN_LOOP_SECONDS);
    } else if (scrubKind.value === 'b') {
      scrubValue.value = Math.max(seconds, loopA.value + MIN_LOOP_SECONDS);
    } else {
      scrubValue.value = seconds;
    }
  }

  async function endScrub() {
    const kind = scrubKind.value;
    const value = scrubValue.value;
    scrubKind.value = null;
    if (!kind) return;
    if (kind === 'head') await source.seek(value);
    else setLoopPoint(kind, value);
  }

  /**
   * The store outlives the view that created it, so losing the session has to
   * stop playback explicitly: without this a track keeps playing behind the
   * connect screen and reconnecting resumes mid-track, seconds further on.
   */
  watch(
    () => session.isConnected,
    (connected) => {
      // Disposing rather than pausing: a device Spotify can no longer get a
      // token for should not stay listed on Spotify Connect. The source
      // re-attaches on demand, so this costs nothing if a session returns.
      if (!connected) source.dispose();
    },
  );

  // Loop wrap and end-of-track, driven by whatever the source reports.
  watch(
    () => source.position.value,
    async (current) => {
      if (isScrubbing.value) return;
      const transition = resolveLoopTransition({
        position: current,
        duration: duration.value,
        loopOn: loopOn.value,
        loopA: loopA.value,
        loopB: loopB.value,
      });
      if (transition === 'wrap') await source.seek(loopA.value);
      else if (transition === 'end') await source.pause();
    },
  );

  return {
    currentTrack,
    loopOn,
    loopA,
    loopB,
    skipSeconds,
    timeDisplay,
    duration,
    isPlaying,
    isReady,
    error,
    isScrubbing,
    scrubKind,
    position,
    displayLoopA,
    displayLoopB,
    nowLabel,
    endLabel,
    skipLabel,
    loadTrack,
    togglePlay,
    rewind,
    forward,
    toggleLoop,
    nudge,
    markPoint,
    beginScrub,
    updateScrub,
    endScrub,
  };
});
