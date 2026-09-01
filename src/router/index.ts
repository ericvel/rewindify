import { createRouter, createWebHistory } from 'vue-router'
import PlayerView from '@/views/PlayerView.vue'
import { useLibraryStore } from '@/stores/library'

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

// An unknown track id falls back to `/`, which then resolves to a real track.
router.beforeEach((to) => {
  if (to.name !== 'track') return true
  const trackId = String(to.params.trackId)
  return useLibraryStore().findTrack(trackId) ? true : '/'
})

export default router
