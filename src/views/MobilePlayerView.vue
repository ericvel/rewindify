<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import AppBrand from '@/components/AppBrand.vue';
import LoopNudger from '@/components/LoopNudger.vue';
import MobileSearchOverlay from '@/components/MobileSearchOverlay.vue';
import NowPlayingHeader from '@/components/NowPlayingHeader.vue';
import PassagesBand from '@/components/PassagesBand.vue';
import PassagesToggle from '@/components/PassagesToggle.vue';
import SessionStatus from '@/components/SessionStatus.vue';
import TimeReadout from '@/components/TimeReadout.vue';
import TransportControls from '@/components/TransportControls.vue';
import TrackTimeline from '@/components/TrackTimeline.vue';
import { useBarCount } from '@/composables/useBarCount';
import { usePlayerKeyboard } from '@/composables/usePlayerKeyboard';
import { usePlayerStore } from '@/stores/player';
import type { Track } from '@/playback/types';

defineProps<{ track: Track }>();
const emit = defineEmits<{ select: [track: Track] }>();

const player = usePlayerStore();
const searchOpen = ref(false);

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

    <NowPlayingHeader :track="track" variant="mobile" />

    <section ref="panel" class="phone__panel">
      <TimeReadout variant="mobile" />
      <TrackTimeline :bar-count="barCount" :field-height="94" variant="mobile" />
    </section>

    <!-- The control group is bottom-anchored on the phone so the keys land
         under the thumb rather than leaving an empty tail below the loop
         switch. On the wide plate the leftover height is split with the header
         instead, and the block sits centred. -->
    <TransportControls class="phone__transport" variant="mobile" />
    <LoopNudger variant="mobile" />

    <!-- The handle keeps the band the switch used to share with it, and the
         block keeps the drawer under its own handle. The switch has moved into
         the nudger above, where it stands with the two ends it arms. -->
    <div class="phone__loop-block">
      <PassagesToggle variant="mobile" />
      <PassagesBand variant="mobile" />
    </div>

    <MobileSearchOverlay v-if="searchOpen" @close="searchOpen = false" @select="onSelect" />

    <footer class="phone__footer">
      <span>Eric Veliyulin · 2026</span>
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

  /* The desktop recess: a wide plate can afford the same air around the field. */
  @include screen-wide {
    padding: 22px 22px 18px;
  }
}

.phone__transport {
  margin-top: auto;
  padding-top: 8px;
}

.phone__loop-block {
  display: flex;
  flex-direction: column;
  flex: none;
}

/* The chassis strip is bled to the plate edges, so it tracks the gutter. */
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

  @include screen-wide {
    margin: 4px -24px -32px;
  }
}
</style>
