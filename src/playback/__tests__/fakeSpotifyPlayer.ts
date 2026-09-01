import type {
  SpotifyPlaybackState,
  SpotifyPlayer,
  SpotifyPlayerConstructor,
  SpotifyPlayerEvents,
  SpotifyPlayerOptions,
} from '@/spotify/sdk'

export interface FakeSpotifyPlayer extends SpotifyPlayer {
  options: SpotifyPlayerOptions
  /** Method names in the order the source called them. */
  calls: string[]
  seekedTo: number[]
  emit<Event extends keyof SpotifyPlayerEvents>(
    event: Event,
    payload: SpotifyPlayerEvents[Event],
  ): void
}

interface FakeConfig {
  /** Null means the device never registers, which a click has to survive. */
  deviceId: string | null
  connects: boolean
}

let config: FakeConfig = { deviceId: 'device-1', connects: true }
let created: FakeSpotifyPlayer | null = null

export function configureFakePlayer(next: Partial<FakeConfig>): void {
  config = { ...config, ...next }
}

export function resetFakePlayer(): void {
  config = { deviceId: 'device-1', connects: true }
  created = null
}

export function lastFakePlayer(): FakeSpotifyPlayer {
  if (!created) throw new Error('No fake player has been constructed.')
  return created
}

/**
 * A stand-in for the Web Playback SDK's `Player`.
 *
 * Real playback cannot be tested without a browser, a Premium account and
 * sound, but everything the source does around it can: when it cues rather than
 * resumes, which states it believes, and what it does with a seek still in
 * flight.
 */
export const FakePlayer: SpotifyPlayerConstructor = class implements SpotifyPlayer {
  readonly calls: string[] = []
  readonly seekedTo: number[] = []
  private readonly listeners = new Map<string, (payload: unknown) => void>()

  constructor(readonly options: SpotifyPlayerOptions) {
    created = this as unknown as FakeSpotifyPlayer
  }

  addListener(event: string, listener: (payload: never) => void): boolean {
    this.listeners.set(event, listener as (payload: unknown) => void)
    return true
  }

  removeListener(event: string): boolean {
    return this.listeners.delete(event)
  }

  emit(event: string, payload: unknown): void {
    this.listeners.get(event)?.(payload)
  }

  async connect(): Promise<boolean> {
    this.calls.push('connect')
    if (!config.connects) return false
    // The real SDK announces the device shortly after connecting; the source
    // registers its listener before calling this, so emitting here is faithful.
    if (config.deviceId !== null) this.emit('ready', { device_id: config.deviceId })
    return true
  }

  disconnect(): void {
    this.calls.push('disconnect')
  }

  async getCurrentState(): Promise<SpotifyPlaybackState | null> {
    return null
  }

  async resume(): Promise<void> {
    this.calls.push('resume')
  }

  async pause(): Promise<void> {
    this.calls.push('pause')
  }

  async seek(positionMs: number): Promise<void> {
    this.calls.push('seek')
    this.seekedTo.push(positionMs)
  }

  async activateElement(): Promise<void> {
    this.calls.push('activateElement')
  }
} as unknown as SpotifyPlayerConstructor

/** A player state as the SDK reports it, in milliseconds. */
export function playbackState(
  overrides: Partial<SpotifyPlaybackState> & { uri?: string } = {},
): SpotifyPlaybackState {
  const { uri = 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp', ...rest } = overrides
  return {
    paused: false,
    position: 0,
    duration: 222_586,
    track_window: {
      current_track: { uri, id: uri.split(':').pop() ?? null, duration_ms: 222_586 },
    },
    ...rest,
  }
}
