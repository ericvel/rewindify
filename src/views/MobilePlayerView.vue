<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AppBrand from '@/components/AppBrand.vue';
import LoopNudger from '@/components/LoopNudger.vue';
import MobileSearchOverlay from '@/components/MobileSearchOverlay.vue';
import NowPlayingHeader from '@/components/NowPlayingHeader.vue';
import SavedLoopsSelect from '@/components/SavedLoopsSelect.vue';
import SessionStatus from '@/components/SessionStatus.vue';
import StepSizeSelect from '@/components/StepSizeSelect.vue';
import TimeReadout from '@/components/TimeReadout.vue';
import TransportControls from '@/components/TransportControls.vue';
import TrackTimeline from '@/components/TrackTimeline.vue';
import { useBarCount } from '@/composables/useBarCount';
import { usePlayerKeyboard } from '@/composables/usePlayerKeyboard';
import { useIsShortWide } from '@/composables/useBreakpoint';
import { usePlayerStore } from '@/stores/player';
import type { Track } from '@/playback/types';

defineProps<{ track: Track }>();
const emit = defineEmits<{ select: [track: Track] }>();

const player = usePlayerStore();
const searchOpen = ref(false);
const isShortWide = useIsShortWide();

/*
 * The plate is full-bleed now, so the field is as wide as the window and a flat
 * bar count does not survive the band: 48 bars is 5.6px of bar at 430 and 16px
 * at 900, by which point the waveform is a row of slabs. The count follows the
 * field instead, at the pitch the composable documents.
 */
const panelEl = useTemplateRef<HTMLElement>('panel');
const barCount = useBarCount(panelEl);

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

    <div class="phone__work">
      <div class="phone__content">
        <NowPlayingHeader :track="track" variant="mobile" :compact="isShortWide" />

        <section ref="panel" class="phone__panel">
          <TimeReadout variant="mobile" :compact="isShortWide" />
          <TrackTimeline
            :bar-count="barCount"
            :field-height="isShortWide ? 54 : 94"
            variant="mobile"
          />
        </section>
      </div>

      <!-- Bottom-anchored in portrait; the right-hand bank in short landscape. -->
      <div class="phone__controls">
        <TransportControls class="phone__transport" variant="mobile" />
        <LoopNudger variant="mobile" :compact="isShortWide" />
        <SavedLoopsSelect variant="mobile" />
      </div>
    </div>

    <MobileSearchOverlay v-if="searchOpen" @close="searchOpen = false" @select="onSelect" />

    <footer class="phone__footer">
      <StepSizeSelect variant="mobile" />
      <span class="phone__credit">Eric Veliyulin · 2026</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

/*
 * The plate is the window, at every width below the desktop breakpoint. It used
 * to be a 430px column centred in the viewport with a hairline down each side,
 * which put a 700px tablet — the most likely thing on a music stand — in a strip
 * with 135px of dead plate either side and every control at phone width. The
 * hairlines went with the cap: they marked the column against the plate behind
 * it, and there is no longer anything behind it.
 */
.phone {
  width: 100%;
  min-height: 100dvh;
  background: var(--surface-plate);
  color: var(--ink);
  position: relative;
  overflow: hidden;
  padding: 0 16px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  /* Wider gutters and a looser column, nearer the desktop working column. */
  @include screen-wide {
    padding: 0 24px 32px;
    gap: 18px;
  }
}

.phone__header {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 60px;
  flex: none;

  /*
   * Two auto margins — this one and the transport's — split the leftover height
   * evenly, so a tall plate keeps the working block together in the middle
   * instead of opening a 200px hole between the timeline and the keys. Same
   * answer the desktop column gives with `safe center`, reached the way a
   * bottom-anchored column can: on the phone the free space stays entirely
   * above the keys, where it buys thumb reach.
   */
  @include screen-wide {
    margin-bottom: auto;
  }
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
  width: 40px;
  height: 40px;
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

  /* The desktop recess: a wide plate can afford the same air around the field. */
  @include screen-wide {
    padding: 22px 22px 18px;
  }
}

/* Wrappers are structural only in portrait, preserving the pinned stack. */
.phone__work,
.phone__content,
.phone__controls {
  display: contents;
}

.phone__transport {
  margin-top: auto;
  padding-top: 8px;
}

/* The chassis strip is bled to the plate edges, so it tracks the gutter. */
.phone__footer {
  height: 48px;
  flex: none;
  margin: 4px -16px -28px;
  box-shadow: inset 0 1px 0 var(--surface-edge);
  background: var(--surface-well);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 20px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--ink-label);

  @include screen-wide {
    margin: 4px -24px -32px;
  }
}

.phone__credit {
  white-space: nowrap;
}

/* Sideways on a stand: information and controls become two banks instead of
   making the musician scroll before touching transport. */
@include screen-short-wide {
  .phone {
    height: 100dvh;
    min-height: 0;
    padding: 0 18px;
    gap: 8px;
  }

  .phone__header {
    height: 48px;
    margin-bottom: 0;
  }

  .phone__work {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
    gap: 18px;
  }

  .phone__content,
  .phone__controls {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }

  .phone__panel {
    padding: 12px 14px 10px;
  }

  .phone__transport {
    margin-top: 0;
    padding-top: 0;
  }

  .phone__footer {
    height: 48px;
    margin: 0 -18px;
  }
}
</style>
