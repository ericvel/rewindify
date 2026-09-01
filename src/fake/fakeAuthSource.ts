import { readonly, ref } from 'vue';
import type { AuthFailure, AuthSource, Session } from '@/auth/types';

const FAKE_SESSION: Session = { displayName: 'Fixture user', product: 'premium' };

/**
 * A session that is simply there.
 *
 * The real flow leaves the page for Spotify and comes back to a registered
 * redirect uri, neither of which a fixture run can do. Starting connected means
 * the app boots straight into the player; disconnecting still works, and lands
 * on the gate, so the connect screen is reachable without an account.
 */
export function createFakeAuthSource(): AuthSource {
  const session = ref<Session | null>(FAKE_SESSION);
  const failure = ref<AuthFailure | null>(null);

  return {
    session: readonly(session),
    failure: readonly(failure),

    async connect() {
      session.value = FAKE_SESSION;
    },

    // Nothing redirects here, so the callback route is only ever reached by hand.
    async completeRedirect() {
      session.value = FAKE_SESSION;
      return '/';
    },

    async disconnect() {
      session.value = null;
    },

    async revalidate() {},
  };
}
