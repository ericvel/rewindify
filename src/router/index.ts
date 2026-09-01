import { createRouter, createWebHistory } from 'vue-router';
import CallbackView from '@/views/CallbackView.vue';
import ConnectView from '@/views/ConnectView.vue';
import PlayerView from '@/views/PlayerView.vue';
import StartView from '@/views/StartView.vue';
import { useLibraryStore } from '@/stores/library';
import { useSessionStore } from '@/stores/session';

/** Routes a visitor without a session is allowed to reach. */
const PUBLIC_ROUTES = new Set(['connect', 'callback']);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // Resolves to what you last played; see the guard below. It renders only
      // for an account with no history at all, which the fixture never had.
      path: '/',
      name: 'start',
      component: StartView,
    },
    {
      path: '/connect',
      name: 'connect',
      component: ConnectView,
    },
    {
      // Where Spotify sends the browser back. Must match the redirect uri
      // registered on the app, character for character.
      path: '/callback',
      name: 'callback',
      component: CallbackView,
    },
    {
      path: '/track/:trackId',
      name: 'track',
      component: PlayerView,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

/**
 * The gate. Registered first so nothing else runs for a visitor without a
 * session, and it carries the intended path along: a shared loop link opened
 * cold should survive connecting rather than dumping you on your own last
 * track.
 */
router.beforeEach((to) => {
  const isConnected = useSessionStore().isConnected;

  if (!isConnected) {
    if (PUBLIC_ROUTES.has(String(to.name))) return true;
    return { name: 'connect', query: { redirect: to.fullPath } };
  }

  return to.name === 'connect' ? '/' : true;
});

/**
 * The play log is not only the `/` redirect's business: the recently played
 * list and the search popover's resting state read it too. Kicking it off for
 * every private route is what keeps it there on a track link opened cold, or on
 * a refresh — the guard below awaits this same in-flight request rather than
 * making a second one.
 */
router.beforeEach((to) => {
  if (!PUBLIC_ROUTES.has(String(to.name))) void useLibraryStore().loadHistory();
  return true;
});

/**
 * `/` stands for "the last thing you played", which is now a request rather
 * than a lookup — the play log has to arrive before the destination is known.
 * An account Spotify remembers nothing for falls through to the start screen.
 */
router.beforeEach(async (to) => {
  if (to.name !== 'start') return true;

  const library = useLibraryStore();
  await library.loadHistory();
  const track = library.mostRecentTrack;

  return track === null ? true : { name: 'track', params: { trackId: track.id } };
});

/**
 * A track id is only a route parameter until Spotify confirms it, so the track
 * is fetched here and cached for the view. An id that is unknown, unplayable in
 * this market, or simply invented falls back to `/`.
 */
router.beforeEach(async (to) => {
  if (to.name !== 'track') return true;
  const track = await useLibraryStore().ensureTrack(String(to.params.trackId));
  return track === null ? { name: 'start' } : true;
});

export default router;
