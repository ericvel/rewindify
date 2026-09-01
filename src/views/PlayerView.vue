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
watch(
  trackId,
  (id) => {
    const track = library.findTrack(id)
    if (track) void player.loadTrack(track, readLoopFromQuery(route.query))
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
