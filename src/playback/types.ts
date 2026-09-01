import type { Ref } from 'vue'

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  /** Track length in seconds. */
  duration: number
  /** Seed for the synthetic waveform. Stands in for real audio analysis. */
  seed: number
  /** Absent in the fixture; a real Spotify track supplies one. */
  artworkUrl?: string
}

export interface RecentEntry {
  trackId: string
  playedAt: number
}

/**
 * Everything the player store needs from whatever is actually making sound.
 *
 * `position` is owned by the source, never written by the store: the mock ticks
 * it from a rAF clock, and a Spotify implementation would report it from the
 * Web Playback SDK. Seeking is a request, not an assignment.
 */
export interface PlaybackSource {
  position: Readonly<Ref<number>>
  duration: Readonly<Ref<number>>
  isPlaying: Readonly<Ref<boolean>>
  load(track: Track): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  seek(seconds: number): Promise<void>
  dispose(): void
}
