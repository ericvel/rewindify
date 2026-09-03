<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DesktopPlayerView from './DesktopPlayerView.vue';
import MobilePlayerView from './MobilePlayerView.vue';
import { useIsDesktop } from '@/composables/useBreakpoint';
import { readLoopFromQuery, useLoopUrlSync } from '@/composables/useLoopUrlSync';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import type { Track } from '@/playback/types';

const route = useRoute();
const router = useRouter();
const library = useLibraryStore();
const player = usePlayerStore();
const isDesktop = useIsDesktop();

const trackId = computed(() => String(route.params.trackId));

// The route is the source of truth for what is loaded; the store never sets it.
// The router's guard has already fetched and cached this track, so `ensureTrack`
// normally answers without a request — but it is still a promise, and the route
// can move on while one is in flight, so the answer is checked before it lands.
watch(
  trackId,
  async (id) => {
    const requested = readLoopFromQuery(route.query);
    const track = await library.ensureTrack(id);
    if (track && trackId.value === id) void player.loadTrack(track, requested);
  },
  { immediate: true },
);

useLoopUrlSync();

/** Picking a track pushes, so Back walks the tracks you have visited. */
function selectTrack(track: Track) {
  if (track.id === trackId.value) return;
  void router.push({ name: 'track', params: { trackId: track.id } });
}
</script>

<template>
  <component
    :is="isDesktop ? DesktopPlayerView : MobilePlayerView"
    v-if="player.currentTrack"
    :track="player.currentTrack"
    @select="selectTrack"
  />
  <!--
    Cold boot only. Picking a track keeps the loaded one on screen until the new
    one lands, so this is the shared link and the reload: the guard's fetch, the
    token exchange and the device registration all happen before there is a
    track to render, and the plate was standing empty and silent while they did.
    The gate's own answer to the same moment, at the same step — see
    `CallbackView`.
  -->
  <div v-else class="player-boot">
    <p class="player-boot__status" role="status">Loading track…</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.player-boot {
  width: 100%;
  min-height: 100dvh;
  background: var(--surface-plate);
  display: grid;
  place-items: center;
}

.player-boot__status {
  @include legend(11px);
  margin: 0;
}
</style>
