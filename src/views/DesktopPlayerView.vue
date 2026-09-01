<script setup lang="ts">
import TrackTimeline from '@/components/TrackTimeline.vue';
import AppIcon from '@/components/AppIcon.vue';
import DesktopSearchField from '@/components/DesktopSearchField.vue';
import LoopNudger from '@/components/LoopNudger.vue';
import LoopToggle from '@/components/LoopToggle.vue';
import NowPlayingHeader from '@/components/NowPlayingHeader.vue';
import SessionStatus from '@/components/SessionStatus.vue';
import TimeReadout from '@/components/TimeReadout.vue';
import TrackRow from '@/components/TrackRow.vue';
import TransportControls from '@/components/TransportControls.vue';
import { usePlayerKeyboard } from '@/composables/usePlayerKeyboard';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import type { Track } from '@/playback/types';

defineProps<{ track: Track }>();
const emit = defineEmits<{ select: [track: Track] }>();

const library = useLibraryStore();
const player = usePlayerStore();

/** Shared with the mobile view; the statusbar legends light from `heldPoint`. */
const { heldPoint } = usePlayerKeyboard();
</script>

<template>
  <div class="desktop">
    <header class="desktop__header">
      <span class="desktop__brand">Rewindify</span>
      <span class="desktop__divider" />
      <DesktopSearchField @select="emit('select', $event)" />
      <span class="desktop__spacer" />
      <!-- Doubles as where playback trouble is reported. An error inverts the
           chip rather than reaching for a second colour: the accent means the
           loop and nothing else, so the strongest remaining signal is ink. -->
      <span
        class="desktop__status"
        :class="{ 'is-alert': player.error !== null }"
        :role="player.error !== null ? 'alert' : undefined"
      >
        <AppIcon v-if="player.error !== null" name="alert" :size="14" />
        {{ player.statusLabel }}
      </span>
      <span class="desktop__divider" />
      <SessionStatus />
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
          <TrackTimeline :bar-count="96" :field-height="152" variant="desktop" />
          <footer class="desktop__loop-status" :class="{ 'is-armed': player.loopOn }">
            <span class="desktop__loop-state">{{ player.loopStatus }}</span>
            <span class="desktop__loop-range">{{ player.loopRange }}</span>
          </footer>
        </section>

        <div class="desktop__controls">
          <TransportControls variant="desktop" />
          <LoopNudger variant="desktop" />
          <LoopToggle class="desktop__loop" variant="desktop" />
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
      <span class="desktop__shortcut">
        <kbd
          class="desktop__key desktop__key--narrow"
          :class="{ 'desktop__key--held': heldPoint === 'a' }"
          >A</kbd
        >
        <kbd
          class="desktop__key desktop__key--narrow"
          :class="{ 'desktop__key--held': heldPoint === 'b' }"
          >B</kbd
        >
        <span class="desktop__shortcut-plus">+</span>
        <kbd class="desktop__key desktop__key--narrow">←</kbd>
        <kbd class="desktop__key desktop__key--narrow">→</kbd>
        <span class="desktop__shortcut-label">Move loop</span>
      </span>
      <span class="desktop__spacer" />
      <span class="desktop__credit">Eric Veliyulin · 2026</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.desktop {
  width: 100%;
  /*
   * A fixed height, not a minimum: the sidebar's play log is as long as the
   * history is, and it is the list that has to scroll. Left to grow, it takes
   * the page with it and drags the timeline off screen.
   */
  height: 100dvh;
  overflow: hidden;
  background: var(--surface-plate);
  color: var(--ink);
  display: flex;
  flex-direction: column;
}

/* Every edge on this surface is a hairline in the plate, never a drawn border. */
.desktop__header {
  height: 56px;
  flex: none;
  box-shadow: inset 0 -1px 0 var(--surface-edge);
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 20px;
}

.desktop__brand {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.desktop__divider {
  width: 1px;
  height: 20px;
  background: var(--surface-edge);
}

.desktop__spacer {
  flex: 1;
}

.desktop__status {
  @include legend(10px);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  &.is-alert {
    padding: 5px 9px;
    border-radius: 3px;
    background: var(--ink);
    color: var(--ink-inverse);
    letter-spacing: 0.05em;
    text-transform: none;
    font-size: 11px;
  }
}

.desktop__body {
  flex: 1;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-height: 0;
}

.desktop__sidebar {
  box-shadow: inset -1px 0 0 var(--surface-edge);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.desktop__sidebar-title {
  @include legend(10px);
  margin: 0;
  padding: 18px 18px 11px;
}

.desktop__sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 2px 8px 12px;
  box-shadow: inset 0 1px 0 var(--surface-rule);
}

/*
 * `safe center` settles the working block between the header and the chassis
 * strip, so a tall window does not leave 200px of dead plate under the
 * controls. The `safe` keyword matters: plain centring makes overflow
 * unreachable off the top edge on short windows, and this column scrolls.
 */
.desktop__main {
  display: flex;
  flex-direction: column;
  justify-content: safe center;
  min-width: 0;
  overflow-y: auto;
  padding: 26px 32px;
  gap: 24px;
}

/* The panel is cut into the plate. It is the one region that must be found
   without looking for it, so it is the only recess on the main column. */
.desktop__panel {
  @include well(4px);
  padding: 22px 22px 14px;
  flex: none;
}

.desktop__loop-status {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  box-shadow: inset 0 1px 0 var(--surface-edge);
  margin-top: 14px;
  padding: 11px 2px 0;
}

.desktop__loop-state {
  @include legend(10px);
  transition: color var(--arm-duration) var(--ease-out);

  .desktop__loop-status.is-armed & {
    color: var(--accent-text);
  }
}

.desktop__loop-range {
  @include figures;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-body);
}

/*
 * Wraps rather than overflowing: at the 900px breakpoint the three groups need
 * more room than the main column has, and an unwrapped row scrolled the whole
 * column sideways. The loop switch keeps to the right edge of whichever line
 * it lands on.
 */
.desktop__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 22px;
  flex: none;
}

.desktop__loop {
  margin-left: auto;
}

/* An engraved chassis strip: recessed a shade below the plate, with the
   keyboard legends screened onto it. */
.desktop__statusbar {
  height: 40px;
  flex: none;
  box-shadow: inset 0 1px 0 var(--surface-edge);
  background: var(--surface-well);
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 0 20px;
}

.desktop__shortcut {
  display: flex;
  align-items: center;
  gap: 7px;
}

.desktop__key {
  @include figures;
  @include cap-light(2px);
  min-width: 20px;
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--ink-body);
  padding: 4px 5px;
}

.desktop__key--narrow {
  min-width: 22px;
}

/* Holding A or B is a real machine state, so the key reads as held down. */
.desktop__key--held {
  background: var(--ink);
  color: var(--ink-inverse);
  box-shadow: var(--shadow-key-held);
  transform: translateY(1px);
}

.desktop__shortcut-plus {
  font-size: 10px;
  font-weight: 500;
  color: var(--ink-label);
}

.desktop__shortcut-label {
  @include legend(10px);
}

.desktop__credit {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--ink-label);
}
</style>
