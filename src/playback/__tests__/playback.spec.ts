import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { formatAgo, formatTime } from '../time'
import { resolveLoopTransition } from '../loop'
import { generateWaveform } from '../waveform'
import { MIN_LOOP_SECONDS, usePlayerStore } from '@/stores/player'
import { TRACKS } from '@/data/tracks'

describe('formatTime', () => {
  it('pads seconds to two digits', () => {
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(600)).toBe('10:00')
  })

  it('floors fractional seconds', () => {
    expect(formatTime(59.9)).toBe('0:59')
  })

  it('clamps negatives to zero', () => {
    expect(formatTime(-10)).toBe('0:00')
  })
})

describe('formatAgo', () => {
  const now = 1_700_000_000_000

  it('labels each bucket', () => {
    expect(formatAgo(now - 30_000, now)).toBe('now')
    expect(formatAgo(now - 18 * 60_000, now)).toBe('18m')
    expect(formatAgo(now - 3 * 3_600_000, now)).toBe('3h')
    expect(formatAgo(now - 26 * 3_600_000, now)).toBe('Yest.')
    expect(formatAgo(now - 5 * 86_400_000, now)).toBe('5d')
  })
})

describe('generateWaveform', () => {
  it('is deterministic for a seed', () => {
    expect(generateWaveform(12, 56)).toEqual(generateWaveform(12, 56))
  })

  it('differs between seeds', () => {
    expect(generateWaveform(12, 56)).not.toEqual(generateWaveform(37, 56))
  })

  it('returns barCount values inside the render range', () => {
    const bars = generateWaveform(51, 96)
    expect(bars).toHaveLength(96)
    for (const bar of bars) {
      expect(bar).toBeGreaterThanOrEqual(0.14)
      expect(bar).toBeLessThanOrEqual(1)
    }
  })
})

describe('loop clamping', () => {
  const track = TRACKS[0]

  beforeEach(() => setActivePinia(createPinia()))

  it('clamps a shared link asking for a loop past the end of the track', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track, { a: 10, b: 9999 })
    expect(player.loopB).toBe(track.duration)
    expect(player.loopA).toBe(10)
  })

  it('clamps a negative start', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track, { a: -50, b: 30 })
    expect(player.loopA).toBe(0)
  })

  it('keeps at least MIN_LOOP_SECONDS between the points', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track, { a: 40, b: 40 })
    expect(player.loopB - player.loopA).toBeGreaterThanOrEqual(MIN_LOOP_SECONDS)
  })

  it('refuses to nudge B below A + MIN_LOOP_SECONDS', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track, { a: 30, b: 33 })
    player.nudge('b', -10)
    expect(player.loopB).toBe(player.loopA + MIN_LOOP_SECONDS)
  })

  it('starts at the beginning, paused, with the loop off', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track)
    expect(player.isPlaying).toBe(false)
    expect(player.loopOn).toBe(false)
    expect(player.position).toBe(0)
  })

  it('still defaults A and B so switching the loop on lands somewhere useful', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track)
    expect(player.loopA).toBe(30)
    expect(player.loopB).toBe(60)
  })

  it('honours a loop asked for by a shared link', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track, { a: 40, b: 70, on: true })
    expect(player.loopOn).toBe(true)
    expect(player.position).toBe(40)
  })
})

describe('resolveLoopTransition', () => {
  const base = { duration: 200, loopOn: true, loopA: 30, loopB: 60 }

  it('wraps once the playhead reaches B', () => {
    expect(resolveLoopTransition({ ...base, position: 60 })).toBe('wrap')
    expect(resolveLoopTransition({ ...base, position: 61 })).toBe('wrap')
  })

  it('stays put inside the loop', () => {
    expect(resolveLoopTransition({ ...base, position: 45 })).toBeNull()
  })

  it('does not wrap on a degenerate loop', () => {
    expect(resolveLoopTransition({ ...base, position: 90, loopA: 60, loopB: 60 })).toBeNull()
  })

  it('ignores the end of the track while looping', () => {
    expect(resolveLoopTransition({ ...base, position: 200, loopOn: true })).toBe('wrap')
  })

  it('ends a finished track when the loop is off', () => {
    expect(resolveLoopTransition({ ...base, position: 200, loopOn: false })).toBe('end')
    expect(resolveLoopTransition({ ...base, position: 199, loopOn: false })).toBeNull()
  })

  it('does nothing before a track is loaded', () => {
    expect(
      resolveLoopTransition({ position: 0, duration: 0, loopOn: false, loopA: 0, loopB: 0 }),
    ).toBeNull()
  })
})
