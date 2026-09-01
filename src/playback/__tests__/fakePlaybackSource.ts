import { nextTick, readonly, ref } from 'vue'
import type { PlaybackSource, Track } from '../types'

export interface FakePlaybackSource extends PlaybackSource {
  /** Moves the playhead the way playing would, without needing a clock. */
  advance(seconds: number): Promise<void>
}

let latest: FakePlaybackSource | null = null

/**
 * A `PlaybackSource` with no Spotify behind it, for testing the player store's
 * own rules — loop clamping, wrapping at B, stopping at the end. Those rules
 * live in the store, so they should be provable without a device.
 */
export function createFakePlaybackSource(): FakePlaybackSource {
  const position = ref(0)
  const duration = ref(0)
  const isPlaying = ref(false)
  const isReady = ref(true)
  const error = ref<string | null>(null)

  const source: FakePlaybackSource = {
    position: readonly(position),
    duration: readonly(duration),
    isPlaying: readonly(isPlaying),
    isReady: readonly(isReady),
    error: readonly(error),

    async load(track: Track) {
      isPlaying.value = false
      duration.value = track.duration
      position.value = 0
    },

    async play() {
      isPlaying.value = true
    },

    async pause() {
      isPlaying.value = false
    },

    async seek(seconds: number) {
      position.value = Math.min(duration.value, Math.max(0, seconds))
    },

    dispose() {
      isPlaying.value = false
    },

    async advance(seconds: number) {
      if (isPlaying.value) {
        position.value = Math.min(duration.value, position.value + seconds)
      }
      // The store reacts to position in a watcher, so let it run.
      await nextTick()
      await nextTick()
    },
  }

  latest = source
  return source
}

/** The source the store under test was handed. */
export function latestFakePlaybackSource(): FakePlaybackSource {
  if (!latest) throw new Error('No fake playback source has been created.')
  return latest
}
