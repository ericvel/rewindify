import { readonly, ref } from 'vue'
import type { PlaybackSource, Track } from './types'

/**
 * Stand-in for the Spotify Web Playback SDK.
 *
 * Position is derived from wall-clock elapsed time against an anchor rather
 * than accumulated per frame, so it neither drifts nor stalls: rAF stops in a
 * hidden tab, and on return the playhead is where real playback would have
 * left it instead of frozen where the tab was backgrounded.
 */
export function createMockPlaybackSource(): PlaybackSource {
  const position = ref(0)
  const duration = ref(0)
  const isPlaying = ref(false)

  let frame: number | null = null
  let anchorPosition = 0
  let anchorTime = 0

  function anchor(at: number) {
    anchorPosition = at
    anchorTime = performance.now()
  }

  function tick() {
    const elapsed = (performance.now() - anchorTime) / 1000
    position.value = Math.min(duration.value, anchorPosition + elapsed)
    frame = requestAnimationFrame(tick)
  }

  function startClock() {
    if (frame !== null) return
    anchor(position.value)
    frame = requestAnimationFrame(tick)
  }

  function stopClock() {
    if (frame === null) return
    cancelAnimationFrame(frame)
    frame = null
  }

  return {
    position: readonly(position),
    duration: readonly(duration),
    isPlaying: readonly(isPlaying),

    async load(track: Track) {
      stopClock()
      isPlaying.value = false
      duration.value = track.duration
      position.value = 0
      anchor(0)
    },

    async play() {
      if (isPlaying.value) return
      isPlaying.value = true
      startClock()
    },

    async pause() {
      if (!isPlaying.value) return
      isPlaying.value = false
      stopClock()
    },

    async seek(seconds: number) {
      position.value = Math.min(duration.value, Math.max(0, seconds))
      anchor(position.value)
    },

    dispose() {
      stopClock()
      isPlaying.value = false
    },
  }
}
