import type { Track } from '@/playback/types'

export interface SpotifyImage {
  url: string
  width: number | null
  height: number | null
}

/** The subset of Spotify's track object this app reads. */
export interface SpotifyTrackObject {
  /** Null for local files, which cannot be routed to or reloaded. */
  id: string | null
  uri: string
  name: string
  duration_ms: number
  /** Only present when the request names a market. */
  is_playable?: boolean
  artists: { name: string }[]
  album?: { name?: string; images?: SpotifyImage[] }
}

/**
 * Waveform seed for a track.
 *
 * Spotify withdrew `audio-analysis` and `audio-features` from new applications
 * in November 2024, so there is no per-sample amplitude to draw and no feature
 * vector left to derive a shape from. The bars stay synthetic; hashing the seed
 * out of the track id at least makes a given track always draw the same one,
 * across reloads and across devices.
 */
export function seedFromId(id: string): number {
  // FNV-1a, for a well-spread hash in a few lines and no dependencies.
  let hash = 2166136261
  for (let index = 0; index < id.length; index++) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 1000
}

/**
 * The smallest artwork still wide enough for the largest slot the app renders
 * (88px, doubled for retina), falling back to the widest on offer. Spotify's
 * own ordering is widest first and not guaranteed, so this sorts rather than
 * indexes.
 */
function pickArtwork(images: SpotifyImage[]): string | undefined {
  const MIN_WIDTH = 176
  const sized = [...images].sort((left, right) => (left.width ?? 0) - (right.width ?? 0))
  const widest = sized[sized.length - 1]
  return (sized.find((image) => (image.width ?? 0) >= MIN_WIDTH) ?? widest)?.url
}

/** Maps a Spotify track to the app's own shape, or null if it is unusable. */
export function toTrack(track: SpotifyTrackObject): Track | null {
  if (!track.id) return null
  return {
    id: track.id,
    uri: track.uri,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(', ') || 'Unknown artist',
    album: track.album?.name ?? '',
    duration: track.duration_ms / 1000,
    seed: seedFromId(track.id),
    artworkUrl: pickArtwork(track.album?.images ?? []),
  }
}

/** Maps a batch, dropping the entries nothing in the app could do anything with. */
export function toTracks(tracks: SpotifyTrackObject[]): Track[] {
  return tracks
    .filter((track) => track.is_playable !== false)
    .map(toTrack)
    .filter((track): track is Track => track !== null)
}
