import type { Ref } from 'vue'

export interface Track {
  /** Spotify track id, which is also what the route carries. */
  id: string
  /** Spotify uri, which is what the player is asked to play. */
  uri: string
  title: string
  artist: string
  album: string
  /** Track length in seconds. */
  duration: number
  /** Seed for the synthetic waveform; hashed from `id`. See `spotify/track.ts`. */
  seed: number
  artworkUrl?: string
}

export interface RecentEntry {
  trackId: string
  playedAt: number
}

/**
 * Everything the player store needs from whatever is actually making sound.
 *
 * `position` is owned by the source, never written by the store: the Spotify
 * implementation interpolates it between the SDK's state events. Seeking is a
 * request, not an assignment.
 *
 * `isReady` and `error` exist because a real device can be absent — still
 * registering, taken over by another Spotify client, or refused outright — and
 * the transport has to be able to say so instead of silently doing nothing.
 */
export interface PlaybackSource {
  position: Readonly<Ref<number>>
  duration: Readonly<Ref<number>>
  isPlaying: Readonly<Ref<boolean>>
  isReady: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  load(track: Track): Promise<void>
  play(): Promise<void>
  pause(): Promise<void>
  seek(seconds: number): Promise<void>
  dispose(): void
}
