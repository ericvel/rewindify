import { readonly } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { MOCK_SESSION } from '@/data/session'
import type { AuthSource, Session } from './types'

/**
 * Stand-in for Spotify's authorisation code flow.
 *
 * Real auth leaves the page: `connect()` would send the browser to Spotify and
 * the app would boot again holding a code to exchange. The mock keeps the same
 * async surface but resolves immediately, so there is no invented "connecting"
 * state to design around. Like a real client it owns its own persistence, so a
 * reload finds the session already there.
 */
export function createMockAuthSource(): AuthSource {
  const session = useLocalStorage<Session | null>('rewindify:session', null)

  return {
    session: readonly(session),

    async connect() {
      session.value = MOCK_SESSION
    },

    async disconnect() {
      session.value = null
    },
  }
}
