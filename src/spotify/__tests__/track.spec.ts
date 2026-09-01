import { describe, expect, it } from 'vitest'
import { seedFromId, toTrack, toTracks, type SpotifyTrackObject } from '../track'

function spotifyTrack(overrides: Partial<SpotifyTrackObject> = {}): SpotifyTrackObject {
  return {
    id: '3n3Ppam7vgaVa1iaRUc9Lp',
    uri: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
    name: 'Mr. Brightside',
    duration_ms: 222_586,
    artists: [{ name: 'The Killers' }],
    album: {
      name: 'Hot Fuss',
      images: [
        { url: 'https://i.scdn.co/large.jpg', width: 640, height: 640 },
        { url: 'https://i.scdn.co/medium.jpg', width: 300, height: 300 },
        { url: 'https://i.scdn.co/small.jpg', width: 64, height: 64 },
      ],
    },
    ...overrides,
  }
}

describe('toTrack', () => {
  it('maps the fields the app renders', () => {
    expect(toTrack(spotifyTrack())).toEqual({
      id: '3n3Ppam7vgaVa1iaRUc9Lp',
      uri: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
      title: 'Mr. Brightside',
      artist: 'The Killers',
      album: 'Hot Fuss',
      duration: 222.586,
      seed: seedFromId('3n3Ppam7vgaVa1iaRUc9Lp'),
      artworkUrl: 'https://i.scdn.co/medium.jpg',
    })
  })

  it('joins collaborating artists into the one line the row has room for', () => {
    const track = toTrack(spotifyTrack({ artists: [{ name: 'Sia' }, { name: 'Labrinth' }] }))
    expect(track?.artist).toBe('Sia, Labrinth')
  })

  it('names an artist even when Spotify supplies none', () => {
    expect(toTrack(spotifyTrack({ artists: [] }))?.artist).toBe('Unknown artist')
  })

  /** Local files have no id, so nothing could route to or reload them. */
  it('drops a track without an id', () => {
    expect(toTrack(spotifyTrack({ id: null }))).toBeNull()
  })

  it('survives a track with no album artwork', () => {
    const track = toTrack(spotifyTrack({ album: { name: 'Hot Fuss', images: [] } }))
    expect(track?.artworkUrl).toBeUndefined()
  })

  it('falls back to the widest image when none is big enough', () => {
    const track = toTrack(
      spotifyTrack({
        album: {
          name: 'Hot Fuss',
          images: [{ url: 'https://i.scdn.co/tiny.jpg', width: 64, height: 64 }],
        },
      }),
    )
    expect(track?.artworkUrl).toBe('https://i.scdn.co/tiny.jpg')
  })
})

describe('toTracks', () => {
  it('drops what this market cannot play, and what has no id', () => {
    const tracks = toTracks([
      spotifyTrack({ is_playable: true }),
      spotifyTrack({ id: 'b', uri: 'spotify:track:b', is_playable: false }),
      spotifyTrack({ id: null }),
    ])
    expect(tracks.map((track) => track.id)).toEqual(['3n3Ppam7vgaVa1iaRUc9Lp'])
  })

  it('keeps a track whose playability Spotify did not report', () => {
    expect(toTracks([spotifyTrack()])).toHaveLength(1)
  })
})

describe('seedFromId', () => {
  it('is stable for an id, so a track always draws the same waveform', () => {
    expect(seedFromId('3n3Ppam7vgaVa1iaRUc9Lp')).toBe(seedFromId('3n3Ppam7vgaVa1iaRUc9Lp'))
  })

  it('spreads ids across the seed range', () => {
    const seeds = new Set(
      ['a', 'b', 'c', '3n3Ppam7vgaVa1iaRUc9Lp', '1301WleyT98MSxVHPZCA6M'].map(seedFromId),
    )
    expect(seeds.size).toBe(5)
    for (const seed of seeds) {
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(1000)
    }
  })
})
