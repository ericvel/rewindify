import type { Ref } from 'vue'

export interface Session {
  displayName: string
  /** Playback needs Premium; a free account can authorise but not play. */
  product: 'premium' | 'free'
}

/**
 * Everything the app needs from whatever actually holds the Spotify session.
 *
 * `session` is owned by the source, never written by the store: the mock sets
 * it from a fixture, and a real implementation would fill it from the token
 * exchange. Connecting is a request, not an assignment.
 */
export interface AuthSource {
  session: Readonly<Ref<Session | null>>
  connect(): Promise<void>
  disconnect(): Promise<void>
}
