<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AppBrand from '@/components/AppBrand.vue';
import LoopNudger from '@/components/LoopNudger.vue';
import LoopToggle from '@/components/LoopToggle.vue';
import MobileSearchOverlay from '@/components/MobileSearchOverlay.vue';
import NowPlayingHeader from '@/components/NowPlayingHeader.vue';
import SessionStatus from '@/components/SessionStatus.vue';
import TimeReadout from '@/components/TimeReadout.vue';
import TransportControls from '@/components/TransportControls.vue';
import TrackTimeline from '@/components/TrackTimeline.vue';
import { usePlayerKeyboard } from '@/composables/usePlayerKeyboard';
import { usePlayerStore } from '@/stores/player';
import type { Track } from '@/playback/types';

defineProps<{ track: Track }>();
const emit = defineEmits<{ select: [track: Track] }>();

const player = usePlayerStore();
const searchOpen = ref(false);

/*
 * A phone-width window is not always a touch-only one, and PRODUCT.md makes the
 * keyboard a requirement rather than a convenience. Handlers stand down while a
 * search field has focus.
 */
usePlayerKeyboard();

function onSelect(track: Track) {
  searchOpen.value = false;
  emit('select', track);
}
</script>

<template>
  <div class="phone">
    <header class="phone__header">
      <AppBrand class="phone__brand" />
      <span class="phone__spacer" />
      <SessionStatus />
      <button
        type="button"
        class="phone__search-button"
        aria-label="Search"
        @click="searchOpen = true"
      >
        <AppIcon name="search" :size="17" />
      </button>
    </header>

    <!--
      Playback trouble was reported on desktop only, and a phone is where a
      device gets stolen by another Spotify client. It appears only when there
      is something true to say.
    -->
    <p v-if="player.error !== null" class="phone__alert" role="alert">
      <AppIcon name="alert" :size="15" />
      <span>{{ player.error }}</span>
    </p>

    <NowPlayingHeader :track="track" variant="mobile" />

    <section class="phone__panel">
      <TimeReadout variant="mobile" />
      <TrackTimeline :bar-count="48" :field-height="94" variant="mobile" />
    </section>

    <!-- The control group is bottom-anchored so the keys land under the thumb
         rather than leaving an empty tail below the loop switch. -->
    <TransportControls class="phone__transport" variant="mobile" />
    <LoopNudger variant="mobile" />
    <LoopToggle variant="mobile" />

    <MobileSearchOverlay v-if="searchOpen" @close="searchOpen = false" @select="onSelect" />

    <footer class="phone__footer">
      <span>Eric Veliyulin · 2026</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.phone {
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--surface-plate);
  box-shadow:
    inset 1px 0 0 var(--surface-edge),
    inset -1px 0 0 var(--surface-edge);
  color: var(--ink);
  position: relative;
  overflow: hidden;
  padding: 0 16px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.phone__header {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 60px;
  flex: none;
}

.phone__spacer {
  flex: 1;
}

/* Type step only; `AppBrand` owns the mark, the weight and the tracking. */
.phone__brand {
  font-size: 17px;
}

.phone__search-button {
  @include cap-light;
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  color: var(--ink-body);
}

/* Inverted ink, not a second hue: the accent means the loop and nothing else. */
.phone__alert {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  padding: 11px 13px;
  border-radius: 3px;
  background: var(--ink);
  color: var(--ink-inverse);
  font-size: 13px;
  line-height: 1.3;
}

/* Two things only: the exact position, and the timeline it sits on. The footer
   that restated the loop's state and its two ends is gone, and the bottom
   padding absorbs the strip it left. */
.phone__panel {
  @include well(4px);
  padding: 18px 16px 16px;
  flex: none;
}

.phone__transport {
  margin-top: auto;
  padding-top: 8px;
}

.phone__footer {
  height: 40px;
  flex: none;
  margin: 4px -16px -28px;
  box-shadow: inset 0 1px 0 var(--surface-edge);
  background: var(--surface-well);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--ink-label);
}
</style>
