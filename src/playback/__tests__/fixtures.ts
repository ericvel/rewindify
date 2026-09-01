import type { Track } from '../types'

/** A track in the shape `spotify/track.ts` produces, for tests that need one. */
export const TEST_TRACK: Track = {
  id: '3n3Ppam7vgaVa1iaRUc9Lp',
  uri: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
  title: 'Mr. Brightside',
  artist: 'The Killers',
  album: 'Hot Fuss',
  duration: 222,
  seed: 12,
}

export const OTHER_TEST_TRACK: Track = {
  id: '1301WleyT98MSxVHPZCA6M',
  uri: 'spotify:track:1301WleyT98MSxVHPZCA6M',
  title: 'Somebody Told Me',
  artist: 'The Killers',
  album: 'Hot Fuss',
  duration: 197,
  seed: 37,
}
