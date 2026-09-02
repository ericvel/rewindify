import { computed } from 'vue';
import { defineStore } from 'pinia';
import { AUTH_FAILURE_MESSAGES } from '@/auth/failures';
import { createSpotifyAuthSource } from '@/auth/spotifyAuthSource';
import { IS_FAKE_SPOTIFY } from '@/fake/enabled';
import { createFakeAuthSource } from '@/fake/fakeAuthSource';

export const useSessionStore = defineStore('session', () => {
  const source = IS_FAKE_SPOTIFY ? createFakeAuthSource() : createSpotifyAuthSource();

  const session = computed(() => source.session.value);
  const isConnected = computed(() => session.value !== null);

  /** As Spotify gives it. The header prints it as content, not as a legend. */
  const displayName = computed(() => session.value?.displayName ?? '');

  /** What the gate should say about the last attempt, if anything. */
  const failureMessage = computed(() =>
    source.failure.value === null ? null : AUTH_FAILURE_MESSAGES[source.failure.value],
  );

  /** Sends the browser to Spotify; nothing after this runs on this page. */
  async function connect(redirectTo: string) {
    await source.connect(redirectTo);
  }

  /** Finishes the flow on the callback route. Returns where to go, or null. */
  async function completeRedirect(params: URLSearchParams) {
    return source.completeRedirect(params);
  }

  async function disconnect() {
    await source.disconnect();
  }

  async function revalidate() {
    await source.revalidate();
  }

  return {
    session,
    isConnected,
    displayName,
    failureMessage,
    connect,
    completeRedirect,
    disconnect,
    revalidate,
  };
});
