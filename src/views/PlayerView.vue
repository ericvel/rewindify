<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DesktopPlayerView from './DesktopPlayerView.vue'
import MobilePlayerView from './MobilePlayerView.vue'
import { useIsDesktop } from '@/composables/useBreakpoint'
import { readLoopFromQuery, useLoopUrlSync } from '@/composables/useLoopUrlSync'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import type { Track } from '@/playback/types'

const route = useRoute()
const router = useRouter()
const library = useLibraryStore()
const player = usePlayerStore()
const isDesktop = useIsDesktop()

const trackId = computed(() => String(route.params.trackId))

// The route is the source of truth for what is loaded; the store never sets it.
// The router's guard has already fetched and cached this track, so `ensureTrack`
// normally answers without a request — but it is still a promise, and the route
// can move on while one is in flight, so the answer is checked before it lands.
watch(
  trackId,
  async (id) => {
    const requested = readLoopFromQuery(route.query)
    const track = await library.ensureTrack(id)
    if (track && trackId.value === id) void player.loadTrack(track, requested)
  },
  { immediate: true },
)

useLoopUrlSync()

/** Picking a track pushes, so Back walks the tracks you have visited. */
function selectTrack(track: Track) {
  if (track.id === trackId.value) return
  void router.push({ name: 'track', params: { trackId: track.id } })
}
</script>

<template>
  <component
    :is="isDesktop ? DesktopPlayerView : MobilePlayerView"
    v-if="player.currentTrack"
    :track="player.currentTrack"
    @select="selectTrack"
  />
</template>

<style scoped lang="scss"></style>
