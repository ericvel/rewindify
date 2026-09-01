<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import DesktopSearchField from '@/components/DesktopSearchField.vue'
import LoopNudger from '@/components/LoopNudger.vue'
import LoopToggle from '@/components/LoopToggle.vue'
import NowPlayingHeader from '@/components/NowPlayingHeader.vue'
import TimeReadout from '@/components/TimeReadout.vue'
import TrackRow from '@/components/TrackRow.vue'
import TransportControls from '@/components/TransportControls.vue'
import WaveformTimeline from '@/components/WaveformTimeline.vue'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import type { Track } from '@/playback/types'

defineProps<{ track: Track }>()
const emit = defineEmits<{ select: [track: Track] }>()

const library = useLibraryStore()
const player = usePlayerStore()

/** Elements that own these keys themselves; the global shortcut stands down. */
const INTERACTIVE = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'])

function ownsKeyboard(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return INTERACTIVE.has(target.tagName) || target.isContentEditable
}

function onKeydown(event: KeyboardEvent) {
  if (ownsKeyboard(event.target)) return
  if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault()
    void player.togglePlay()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    void player.rewind()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    void player.forward()
  } else if (event.key.toLowerCase() === 'l') {
    event.preventDefault()
    player.toggleLoop()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="desktop">
    <header class="desktop__header">
      <span class="desktop__brand">Rewindify</span>
      <span class="desktop__divider" />
      <DesktopSearchField @select="emit('select', $event)" />
      <span class="desktop__spacer" />
      <span class="desktop__status">{{ player.statusLabel }}</span>
    </header>

    <div class="desktop__body">
      <aside class="desktop__sidebar">
        <h2 class="desktop__sidebar-title">Recently played</h2>
        <div class="desktop__sidebar-list">
          <TrackRow
            v-for="entry in library.recentTracks"
            :key="entry.track.id"
            :track="entry.track"
            :played-at="entry.playedAt"
            :active="entry.track.id === player.currentTrack?.id"
            size="md"
            @select="emit('select', entry.track)"
          />
        </div>
      </aside>

      <main class="desktop__main">
        <NowPlayingHeader :track="track" variant="desktop" />

        <section class="desktop__panel">
          <TimeReadout variant="desktop" />
          <WaveformTimeline :bar-count="96" :wave-height="140" variant="desktop" />
          <footer class="desktop__loop-status">
            <span class="desktop__loop-state">{{ player.loopStatus }}</span>
            <span class="desktop__loop-range">{{ player.loopRange }}</span>
          </footer>
        </section>

        <div class="desktop__controls">
          <TransportControls variant="desktop" />
          <LoopNudger variant="desktop" />
          <span class="desktop__spacer" />
          <LoopToggle variant="desktop" />
        </div>
      </main>
    </div>

    <footer class="desktop__statusbar">
      <span class="desktop__shortcut">
        <kbd class="desktop__key">SPACE</kbd>
        <span class="desktop__shortcut-label">{{ player.isPlaying ? 'Pause' : 'Play' }}</span>
      </span>
      <span class="desktop__shortcut">
        <kbd class="desktop__key desktop__key--narrow">←</kbd>
        <kbd class="desktop__key desktop__key--narrow">→</kbd>
        <span class="desktop__shortcut-label">Skip</span>
      </span>
      <span class="desktop__shortcut">
        <kbd class="desktop__key desktop__key--narrow">L</kbd>
        <span class="desktop__shortcut-label">Loop</span>
      </span>
      <span class="desktop__spacer" />
      <span class="desktop__credit">Eric Veliyulin · 2026</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.desktop {
  width: 100%;
  min-height: 100dvh;
  background: #ffffff;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    sans-serif;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.desktop__header {
  height: 52px;
  flex: none;
  border-bottom: 1px solid #9a9a9a;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
}

.desktop__brand {
  font-size: 15px;
  font-weight: 600;
}

.desktop__divider {
  width: 1px;
  height: 22px;
  background: #d4d4d4;
}

.desktop__spacer {
  flex: 1;
}

.desktop__status {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
}

.desktop__body {
  flex: 1;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-height: 0;
}

.desktop__sidebar {
  border-right: 1px solid #9a9a9a;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.desktop__sidebar-title {
  margin: 0;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.12em;
  color: #767676;
  text-transform: uppercase;
  padding: 16px 18px 10px;
}

.desktop__sidebar-list {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid #d4d4d4;
}

.desktop__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 24px 32px 0;
  gap: 24px;
}

.desktop__panel {
  border: 1px solid #9a9a9a;
  padding: 20px 20px 12px;
  flex: none;
}

.desktop__loop-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #d4d4d4;
  margin-top: 8px;
  padding: 10px 2px 0;
}

.desktop__loop-state {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
}

.desktop__loop-range {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #4a4a4a;
}

.desktop__controls {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: none;
  padding-bottom: 24px;
}

.desktop__statusbar {
  height: 36px;
  flex: none;
  border-top: 1px solid #9a9a9a;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 20px;
}

.desktop__shortcut {
  display: flex;
  align-items: center;
  gap: 8px;
}

.desktop__key {
  text-align: center;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  line-height: 1;
  color: #4a4a4a;
  border: 1px solid #d4d4d4;
  padding: 3px 5px;
}

.desktop__key--narrow {
  min-width: 22px;
}

.desktop__shortcut-label {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
}

.desktop__credit {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #9a9a9a;
}
</style>
