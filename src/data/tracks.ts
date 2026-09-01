import type { Track } from '@/playback/types'

/**
 * Mock catalogue. Replaced by Spotify search results once the real
 * `PlaybackSource` lands; `artworkUrl` is deliberately absent so the hatched
 * placeholder renders.
 *
 * Typed as a non-empty tuple so `TRACKS[0]` is always a usable fallback.
 */
export const TRACKS: [Track, ...Track[]] = [
  {
    id: 'slow-burn-shuffle',
    title: 'Slow Burn Shuffle',
    artist: 'The Hollow Kings',
    album: 'Dust & Amber',
    duration: 222,
    seed: 12,
  },
  {
    id: 'neon-backroad',
    title: 'Neon Backroad',
    artist: 'Marta Vance',
    album: 'Long Way Down',
    duration: 245,
    seed: 37,
  },
  {
    id: 'copperline',
    title: 'Copperline',
    artist: 'Ruby Ash',
    album: 'Copperline',
    duration: 198,
    seed: 51,
  },
  {
    id: 'tremolo-sunday',
    title: 'Tremolo Sunday',
    artist: 'Fenwick Trio',
    album: 'Room Tone',
    duration: 312,
    seed: 8,
  },
  {
    id: 'static-bloom',
    title: 'Static Bloom',
    artist: 'Kite Season',
    album: 'Static Bloom EP',
    duration: 236,
    seed: 63,
  },
]

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** Plausible listening history for a first run, relative to when the app loads. */
export function seedRecent() {
  const now = Date.now()
  return [
    { trackId: 'slow-burn-shuffle', playedAt: now - 30_000 },
    { trackId: 'tremolo-sunday', playedAt: now - 18 * MINUTE },
    { trackId: 'neon-backroad', playedAt: now - HOUR },
    { trackId: 'static-bloom', playedAt: now - 3 * HOUR },
    { trackId: 'copperline', playedAt: now - 26 * HOUR },
  ]
}
