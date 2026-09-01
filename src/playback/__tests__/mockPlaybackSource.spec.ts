import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMockPlaybackSource } from '../mockPlaybackSource'
import { TRACKS } from '@/data/tracks'
import { usePlayerStore } from '@/stores/player'

const track = TRACKS[0]

/** Drives the rAF clock by hand so playback can be asserted without a browser. */
function useFakeClock() {
  let now = 0
  let pending: FrameRequestCallback[] = []

  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    pending.push(cb)
    return pending.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    pending = []
  })

  return async function advance(ms: number) {
    now += ms
    const frames = pending
    pending = []
    for (const frame of frames) frame(now)
    await nextTick()
    await nextTick()
  }
}

describe('mock playback source', () => {
  let advance: (ms: number) => Promise<void>

  beforeEach(() => {
    setActivePinia(createPinia())
    advance = useFakeClock()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not advance until playback starts', async () => {
    const source = createMockPlaybackSource()
    await source.load(track)
    await advance(2000)
    expect(source.position.value).toBe(0)
  })

  it('advances in wall-clock seconds while playing', async () => {
    const source = createMockPlaybackSource()
    await source.load(track)
    await source.play()
    await advance(2500)
    expect(source.position.value).toBeCloseTo(2.5, 5)
  })

  it('resumes from where it paused rather than from the anchor', async () => {
    const source = createMockPlaybackSource()
    await source.load(track)
    await source.play()
    await advance(2000)
    await source.pause()
    await advance(10_000)
    await source.play()
    await advance(1000)
    expect(source.position.value).toBeCloseTo(3, 5)
  })

  it('never runs past the track duration', async () => {
    const source = createMockPlaybackSource()
    await source.load(track)
    await source.play()
    await advance((track.duration + 60) * 1000)
    expect(source.position.value).toBe(track.duration)
  })
})

describe('player store over the mock source', () => {
  let advance: (ms: number) => Promise<void>

  beforeEach(() => {
    setActivePinia(createPinia())
    advance = useFakeClock()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('wraps back to A when the playhead reaches B', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track, { a: 30, b: 33, on: true })
    await player.togglePlay()

    await advance(1000)
    expect(player.position).toBeCloseTo(31, 5)

    await advance(2500)
    expect(player.position).toBeGreaterThanOrEqual(30)
    expect(player.position).toBeLessThan(33)
    expect(player.isPlaying).toBe(true)
  })

  it('pauses at the end of the track when the loop is off', async () => {
    const player = usePlayerStore()
    await player.loadTrack(track, { a: 30, b: 33, on: false })
    await player.togglePlay()
    await advance(track.duration * 1000)
    expect(player.isPlaying).toBe(false)
    expect(player.position).toBe(track.duration)
  })
})
