import { computed, onScopeDispose, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { createSpotifyPlaybackSource } from '@/playback/spotifyPlaybackSource';
import { IS_FAKE_SPOTIFY } from '@/fake/enabled';
import { createFakePlaybackSource } from '@/fake/fakePlaybackSource';
import { resolveLoopTransition } from '@/playback/loop';
import {
  MAX_LOOPS_PER_TRACK,
  addSavedLoop,
  findSavedLoop,
  newLoopId,
  normaliseName,
  normaliseSavedLoops,
} from '@/playback/savedLoops';
import { formatTime } from '@/playback/time';
import { useLocalStorage } from '@/composables/useLocalStorage';
import { useLibraryStore } from './library';
import { useSessionStore } from './session';
import type { SavedLoopStore } from '@/playback/savedLoops';
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

  /*
   * Saved loops, by track. Normalised on boot rather than trusted:
   * `useLocalStorage` parses and casts without looking, and this is the first
   * structured value the app persists, so a hand-edited blob has to fail as
   * dropped rows instead of as a broken band.
   */
  const savedLoops = useLocalStorage<SavedLoopStore>('rewindify:saved-loops', {});
  savedLoops.value = normaliseSavedLoops(savedLoops.value);

  /** Whether the saved-loops drawer is drawn open. Transient; not persisted. */
  const savedLoopsOpen = ref(false);
  /**
   * Bumped by `S` and by the band's own save control. A counter rather than a
   * flag so the band can react to a second request without a reset dance.
   */
  const loopSaveRequest = ref(0);

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

  /** The loaded track's saved loops, newest first. */
  const trackSavedLoops = computed(() =>
    currentTrack.value ? (savedLoops.value[currentTrack.value.id] ?? []) : [],
  );

  /**
   * The saved loop holding the current bounds, whether or not the loop is on.
   * Used to refuse a duplicate save; the band reads `armedSavedLoopId`.
   */
  const matchedSavedLoop = computed(() =>
    findSavedLoop(trackSavedLoops.value, loopA.value, loopB.value),
  );

  /**
   * The saved loop that is *in effect*, which needs the loop switched on: a
   * stored span the user has turned off is not the span they are playing.
   * This is what carries the accent in the band, so it leaves the row on the
   * same 320ms sweep that empties the timeline.
   */
  const armedSavedLoopId = computed(() =>
    loopOn.value ? (matchedSavedLoop.value?.id ?? null) : null,
  );

  /**
   * Why saving is unavailable, or null when it is available.
   *
   * Printed nowhere: loop on/off is the switch's and the bracket's to state,
   * and a legend here would be a third home for that bit. The disabled save
   * control is the whole visible statement, and this string is what it carries
   * as its accessible name so the reason survives for a screen reader.
   */
  const saveLoopBlocked = computed<string | null>(() => {
    if (currentTrack.value === null) return 'No track is loaded';
    if (!loopOn.value) return 'Turn the loop on to save it';
    if (matchedSavedLoop.value !== undefined) return 'This loop is already saved';
    if (trackSavedLoops.value.length >= MAX_LOOPS_PER_TRACK) {
      return `This track already holds ${MAX_LOOPS_PER_TRACK} saved loops`;
    }
    return null;
  });

  function toggleSavedLoops() {
    savedLoopsOpen.value = !savedLoopsOpen.value;
  }

  function closeSavedLoops() {
    savedLoopsOpen.value = false;
  }

  /**
   * `S`, and the band's save control. Opens the band either way — with the loop
   * off there is nothing to save, and showing the disabled control is a truer
   * answer than a keypress that does nothing at all.
   */
  function requestLoopSave() {
    savedLoopsOpen.value = true;
    loopSaveRequest.value++;
  }

  /** Stores the current bounds. An empty name is stored as none, not as `''`. */
  function saveLoop(name: string | null) {
    const track = currentTrack.value;
    if (!track || saveLoopBlocked.value !== null) return;
    savedLoops.value = {
      ...savedLoops.value,
      [track.id]: addSavedLoop(trackSavedLoops.value, {
        id: newLoopId(),
        name: normaliseName(name),
        a: loopA.value,
        b: loopB.value,
        savedAt: Date.now(),
      }),
    };
  }

  /**
   * Re-enters a saved loop: sets both ends, arms the loop, and seeks to A.
   *
   * The seek is the deliberate difference from `nudge`. Nudging happens while
   * listening, where a forced seek fights the user; applying a saved loop is an
   * unambiguous "take me back to those bars", and landing anywhere else would
   * make the user press rewind to finish the job they just asked for.
   */
  async function applySavedLoop(id: string) {
    const found = trackSavedLoops.value.find((entry) => entry.id === id);
    if (!found) return;
    const clamped = clampLoop(found.a, found.b, duration.value);
    loopA.value = clamped.a;
    loopB.value = clamped.b;
    loopOn.value = true;
    await source.seek(clamped.a);
  }

  function deleteSavedLoop(id: string) {
    const track = currentTrack.value;
    if (!track) return;
    const remaining = trackSavedLoops.value.filter((entry) => entry.id !== id);
    const next = { ...savedLoops.value };
    // An emptied track leaves the blob rather than sitting in it as `[]`.
    if (remaining.length > 0) next[track.id] = remaining;
    else delete next[track.id];
    savedLoops.value = next;
  }

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

  /**
   * One arrow-key skip step. Held arrows repeat at the OS key rate, and seeking
   * on every repeat floods the Spotify API and makes the audio stutter, so a
   * step only moves the same scrub state a pointer drag uses: the playhead
   * follows on screen, the loop watcher stands down, and `endScrub` turns the
   * whole hold into a single seek on release.
   */
  function stepSkip(direction: -1 | 1) {
    const floor = loopOn.value ? loopA.value : 0;
    const ceiling = loopOn.value ? loopB.value : duration.value;
    const next = position.value + direction * skipSeconds.value;
    scrubKind.value = 'head';
    scrubValue.value = Math.min(ceiling, Math.max(floor, next));
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
    trackSavedLoops,
    armedSavedLoopId,
    saveLoopBlocked,
    savedLoopsOpen,
    loopSaveRequest,
    toggleSavedLoops,
    closeSavedLoops,
    requestLoopSave,
    saveLoop,
    applySavedLoop,
    deleteSavedLoop,
    loadTrack,
    togglePlay,
    rewind,
    forward,
    stepSkip,
    toggleLoop,
    nudge,
    markPoint,
    beginScrub,
    updateScrub,
    endScrub,
  };
});
