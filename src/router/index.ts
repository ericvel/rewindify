import { createRouter, createWebHistory } from 'vue-router'
import ConnectView from '@/views/ConnectView.vue'
import PlayerView from '@/views/PlayerView.vue'
import { useLibraryStore } from '@/stores/library'
import { useSessionStore } from '@/stores/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // The design has no empty state, so bare `/` resolves to what you last played.
      path: '/',
      redirect: () => ({
        name: 'track',
        params: { trackId: useLibraryStore().mostRecentTrack.id },
      }),
    },
    {
      path: '/connect',
      name: 'connect',
      component: ConnectView,
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
})

/**
 * The gate. Registered first so nothing else runs for a visitor without a
 * session, and it carries the intended path along: a shared loop link opened
 * cold should survive connecting rather than dumping you on your own last
 * track. Note `/` resolves its redirect before guards run, so the stashed path
 * is already `/track/<mostRecent>` — the same destination either way.
 */
router.beforeEach((to) => {
  const isConnected = useSessionStore().isConnected

  if (!isConnected) {
    if (to.name === 'connect') return true
    return { name: 'connect', query: { redirect: to.fullPath } }
  }

  return to.name === 'connect' ? '/' : true
})

// An unknown track id falls back to `/`, which then resolves to a real track.
router.beforeEach((to) => {
  if (to.name !== 'track') return true
  const trackId = String(to.params.trackId)
  return useLibraryStore().findTrack(trackId) ? true : '/'
})

export default router
