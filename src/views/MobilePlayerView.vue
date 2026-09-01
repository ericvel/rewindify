<script setup lang="ts">
import { ref } from 'vue'
import LoopNudger from '@/components/LoopNudger.vue'
import LoopToggle from '@/components/LoopToggle.vue'
import MobileSearchOverlay from '@/components/MobileSearchOverlay.vue'
import NowPlayingHeader from '@/components/NowPlayingHeader.vue'
import SessionStatus from '@/components/SessionStatus.vue'
import TimeReadout from '@/components/TimeReadout.vue'
import TransportControls from '@/components/TransportControls.vue'
import WaveformTimeline from '@/components/WaveformTimeline.vue'
import { usePlayerStore } from '@/stores/player'
import type { Track } from '@/playback/types'

defineProps<{ track: Track }>()
const emit = defineEmits<{ select: [track: Track] }>()

const player = usePlayerStore()
const searchOpen = ref(false)

function onSelect(track: Track) {
  searchOpen.value = false
  emit('select', track)
}
</script>

<template>
  <div class="phone">
    <header class="phone__header">
      <span class="phone__brand">Rewindify</span>
      <span class="phone__spacer" />
      <SessionStatus />
      <button type="button" class="phone__search-button" @click="searchOpen = true">
        <span class="phone__search-icon" aria-hidden="true">⌕</span>
        <span class="phone__search-text">Search</span>
      </button>
    </header>

    <NowPlayingHeader :track="track" variant="mobile" />

    <section class="phone__panel">
      <TimeReadout variant="mobile" />
      <WaveformTimeline :bar-count="56" :wave-height="76" variant="mobile" />
      <footer class="phone__loop-status">
        <span class="phone__loop-state">{{ player.loopStatus }}</span>
        <span class="phone__loop-range">{{ player.loopRange }}</span>
      </footer>
    </section>

    <TransportControls variant="mobile" />
    <LoopNudger variant="mobile" />
    <LoopToggle variant="mobile" />

    <MobileSearchOverlay v-if="searchOpen" @close="searchOpen = false" @select="onSelect" />

    <footer class="phone__footer">
      <span>Eric Veliyulin · 2026</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.phone {
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;
  background: #ffffff;
  border-left: 1px solid #d4d4d4;
  border-right: 1px solid #d4d4d4;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    sans-serif;
  color: #1a1a1a;
  position: relative;
  overflow: hidden;
  padding: 0 16px 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phone__header {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  flex: none;
}

.phone__spacer {
  flex: 1;
}

.phone__brand {
  font-size: 16px;
  font-weight: 600;
}

.phone__search-button {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #9a9a9a;
  background: #ffffff;
}

.phone__search-icon {
  font-size: 13px;
  color: #767676;
}

.phone__search-text {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #1a1a1a;
  text-transform: uppercase;
}

.phone__panel {
  border: 1px solid #9a9a9a;
  background: #ffffff;
  padding: 16px 16px 12px;
  flex: none;
}

.phone__loop-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #d4d4d4;
  margin-top: 4px;
  padding: 10px 2px 0;
}

.phone__loop-state {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
}

.phone__loop-range {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #4a4a4a;
}

.phone__footer {
  height: 36px;
  flex: none;
  margin: auto -16px -28px;
  border-top: 1px solid #9a9a9a;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #9a9a9a;
}
</style>
