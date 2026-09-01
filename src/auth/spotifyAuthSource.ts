import { onScopeDispose, readonly, ref } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { fetchProfile } from '@/spotify/api'
import {
  AUTHORIZE_ENDPOINT,
  CLIENT_ID,
  IS_CONFIGURED,
  IS_REDIRECT_ORIGIN_ALLOWED,
  REDIRECT_URI,
  SCOPES,
} from '@/spotify/config'
import { createCodeVerifier, createState, deriveCodeChallenge } from '@/spotify/pkce'
import { AuthLostError, clearTokens, exchangeCode, hasTokens, onAuthLost } from '@/spotify/tokens'
import type { AuthFailure, AuthSource, Session } from './types'

const SESSION_KEY = 'rewindify:session'
const PENDING_KEY = 'rewindify:pendingAuth'

interface PendingAuth {
  verifier: string
  state: string
  redirectTo: string
}

/**
 * Session storage, not local: the pending attempt belongs to the tab that
 * started it and dies with it. A verifier left behind in local storage would
 * outlive its authorisation code and be offered to the next attempt, which
 * would then fail the exchange for no visible reason.
 */
function writePending(pending: PendingAuth): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    // The exchange will fail as an unverifiable callback, which is the truth.
  }
}

function takePending(): PendingAuth | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as Partial<PendingAuth>
    if (typeof parsed.verifier !== 'string' || typeof parsed.state !== 'string') return null
    return {
      verifier: parsed.verifier,
      state: parsed.state,
      redirectTo: typeof parsed.redirectTo === 'string' ? parsed.redirectTo : '/',
    }
  } catch {
    return null
  }
}

/**
 * The real thing: Spotify's authorisation code flow with PKCE.
 *
 * The profile is persisted next to the tokens so a reload knows synchronously
 * whether it holds a session. The router's gate runs before any request could
 * answer that, and bouncing a returning visitor to the connect screen for the
 * length of a round trip would be a worse lie than trusting storage for one
 * tick — `revalidate` then confirms it against Spotify.
 */
export function createSpotifyAuthSource(): AuthSource {
  const session = useLocalStorage<Session | null>(SESSION_KEY, null)
  const failure = ref<AuthFailure | null>(null)

  // A refresh Spotify refuses can happen inside any request, so the end of a
  // session is not always something the user did.
  const stopListening = onAuthLost(() => {
    session.value = null
    failure.value = 'expired'
  })
  onScopeDispose(stopListening)

  /** Storage and tokens go together; a session without tokens is a dead end. */
  function forget() {
    clearTokens()
    session.value = null
  }

  async function adopt(): Promise<AuthFailure | null> {
    const profile = await fetchProfile()
    if (profile.product !== 'premium') {
      forget()
      return 'free-account'
    }
    session.value = profile
    return null
  }

  return {
    session: readonly(session),
    failure: readonly(failure),

    async connect(redirectTo: string) {
      failure.value = null
      if (!IS_CONFIGURED) {
        failure.value = 'unconfigured'
        return
      }
      // Refused here rather than by Spotify, which would only say the client is
      // invalid — and only after a round trip.
      if (!IS_REDIRECT_ORIGIN_ALLOWED) {
        failure.value = 'bad-origin'
        return
      }

      const verifier = createCodeVerifier()
      const state = createState()
      writePending({ verifier, state, redirectTo })

      const url = new URL(AUTHORIZE_ENDPOINT)
      url.search = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES.join(' '),
        state,
        code_challenge_method: 'S256',
        code_challenge: await deriveCodeChallenge(verifier),
      }).toString()

      window.location.assign(url.toString())
    },

    async completeRedirect(params: URLSearchParams) {
      // Taken unconditionally: a callback that cannot be used must not leave a
      // verifier behind for the next one.
      const pending = takePending()
      failure.value = null

      const error = params.get('error')
      if (error !== null) {
        failure.value = error === 'access_denied' ? 'denied' : 'exchange-failed'
        return null
      }

      const code = params.get('code')
      if (code === null || pending === null || params.get('state') !== pending.state) {
        failure.value = 'invalid-callback'
        return null
      }

      try {
        await exchangeCode(code, pending.verifier)
        const rejected = await adopt()
        if (rejected) {
          failure.value = rejected
          return null
        }
        return pending.redirectTo
      } catch {
        forget()
        failure.value = 'exchange-failed'
        return null
      }
    },

    async disconnect() {
      forget()
      failure.value = null
    },

    async revalidate() {
      if (session.value === null) {
        // Tokens with no profile are unreachable state from an interrupted
        // exchange; clearing them keeps the gate and storage telling one story.
        if (hasTokens()) clearTokens()
        return
      }

      if (!hasTokens()) {
        session.value = null
        return
      }

      try {
        const rejected = await adopt()
        if (rejected) failure.value = rejected
      } catch (error) {
        // Only a refusal ends the session. A flaky network leaves the restored
        // session alone rather than throwing the user out over one failed call.
        if (error instanceof AuthLostError) {
          session.value = null
          failure.value = 'expired'
        }
      }
    },
  }
}
