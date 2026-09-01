import { readonly, ref } from 'vue';
import type { PlaybackSource, Track } from '@/playback/types';

/** Coarse enough to be cheap, fine enough for the loop to wrap where it should. */
const TICK_MS = 100;

/**
 * Elapsed wall clock, not a tick count.
 *
 * A browser throttles timers in a hidden tab to about one a minute, and a
 * playhead that assumed its own interval would then run minutes slow — which
 * is exactly the case when an agent drives the app in a background tab. Reading
 * the clock keeps the position true however rarely the tick lands.
 */
function elapsedSince(mark: number): number {
  return (performance.now() - mark) / 1000;
}

/**
 * A playback device with no audio behind it.
 *
 * The Web Playback SDK needs Premium and a real Spotify session, so a fixture
 * run has no device to register. This advances a playhead on a timer instead:
 * silent, but the store's loop rules, the transport and the timeline all react
 * to position exactly as they would to the real thing.
 */
export function createFakePlaybackSource(): PlaybackSource {
  const position = ref(0);
  const duration = ref(0);
  const isPlaying = ref(false);
  const isReady = ref(true);
  const error = ref<string | null>(null);

  /** When the current stretch of playing started, and from where. */
  let startedAt = 0;
  let startedFrom = 0;

  const timer = setInterval(() => {
    if (!isPlaying.value) return;
    const next = startedFrom + elapsedSince(startedAt);
    if (next >= duration.value) {
      position.value = duration.value;
      isPlaying.value = false;
      return;
    }
    position.value = next;
  }, TICK_MS);

  return {
    position: readonly(position),
    duration: readonly(duration),
    isPlaying: readonly(isPlaying),
    isReady: readonly(isReady),
    error: readonly(error),

    async load(track: Track) {
      isPlaying.value = false;
      duration.value = track.duration;
      position.value = 0;
    },

    async play() {
      startedFrom = position.value;
      startedAt = performance.now();
      isPlaying.value = true;
    },

    async pause() {
      isPlaying.value = false;
    },

    async seek(seconds: number) {
      position.value = Math.min(duration.value, Math.max(0, seconds));
      startedFrom = position.value;
      startedAt = performance.now();
    },

    dispose() {
      clearInterval(timer);
      isPlaying.value = false;
    },
  };
}
