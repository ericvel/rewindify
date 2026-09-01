import type { Ref } from 'vue'

export interface Session {
  displayName: string
  /** Playback needs Premium; a free account can authorise but not stream. */
  product: 'premium' | 'free'
}

/**
 * Why an attempt to connect ended without a session. Each maps to a line of
 * copy on the gate — see `failures.ts`.
 */
export type AuthFailure =
  | 'unconfigured'
  | 'bad-origin'
  | 'denied'
  | 'invalid-callback'
  | 'exchange-failed'
  | 'free-account'
  | 'expired'

/**
 * Everything the app needs from whatever actually holds the Spotify session.
 *
 * `session` is owned by the source, never written by the store: it is filled
 * from the token exchange and cleared when Spotify stops honouring the tokens.
 * Connecting is a request, not an assignment — and a request that leaves the
 * page, which is why it takes the destination to come back to and why the
 * answer arrives later, at `completeRedirect`.
 */
export interface AuthSource {
  session: Readonly<Ref<Session | null>>
  failure: Readonly<Ref<AuthFailure | null>>
  /** Sends the browser to Spotify. Resolves only if the redirect never happens. */
  connect(redirectTo: string): Promise<void>
  /** Finishes the flow. Returns where to go next, or null if it failed. */
  completeRedirect(params: URLSearchParams): Promise<string | null>
  disconnect(): Promise<void>
  /** Re-checks a session restored from storage against Spotify. */
  revalidate(): Promise<void>
}
