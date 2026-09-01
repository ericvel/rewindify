<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue';
import { usePlayerStore, type ScrubKind } from '@/stores/player';
import { generateWaveform } from '@/playback/waveform';

const props = withDefaults(
  defineProps<{
    barCount: number;
    waveHeight: number;
    variant?: 'mobile' | 'desktop';
  }>(),
  { variant: 'mobile' },
);

const player = usePlayerStore();
const trackEl = ref<HTMLElement | null>(null);

/** Recomputed per track, not per frame: the playhead only changes bar classes. */
const barHeights = computed(() => {
  const track = player.currentTrack;
  if (!track) return [];
  return generateWaveform(track.seed, props.barCount).map(
    (level) => `${Math.round(level * props.waveHeight)}px`,
  );
});

/** A bar sits at fraction `(i + 0.5) / barCount` of the track. */
function barAt(seconds: number) {
  if (player.duration <= 0) return 0;
  return (seconds / player.duration) * props.barCount - 0.5;
}

const playedBarIndex = computed(() => Math.floor(barAt(player.position)));
const loopStartBar = computed(() => Math.ceil(barAt(player.displayLoopA)));
const loopEndBar = computed(() => Math.floor(barAt(player.displayLoopB)));

function percent(seconds: number) {
  if (player.duration <= 0) return '0%';
  return `${(seconds / player.duration) * 100}%`;
}

const headLeft = computed(() => percent(player.position));
const loopLeft = computed(() => percent(player.displayLoopA));
const loopRight = computed(() => percent(player.displayLoopB));
const loopWidth = computed(() => percent(player.displayLoopB - player.displayLoopA));

function fractionFromEvent(event: PointerEvent) {
  const el = trackEl.value;
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
}

function onMove(event: PointerEvent) {
  player.updateScrub(fractionFromEvent(event));
}

function onUp() {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  void player.endScrub();
}

function startDrag(kind: ScrubKind, event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
  player.beginScrub(kind, fractionFromEvent(event));
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

onScopeDispose(() => {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
});
</script>

<template>
  <div
    ref="trackEl"
    class="waveform"
    :class="`waveform--${variant}`"
    :style="{ '--wave-height': `${waveHeight}px` }"
    @pointerdown="startDrag('head', $event)"
  >
    <div class="waveform__bars">
      <div
        v-for="(height, index) in barHeights"
        :key="index"
        class="waveform__bar"
        :class="{
          'is-played': index <= playedBarIndex,
          'is-in-loop': player.loopOn && index >= loopStartBar && index <= loopEndBar,
        }"
        :style="{ height }"
      />
    </div>

    <div
      v-if="player.loopOn"
      class="waveform__region"
      :style="{ left: loopLeft, width: loopWidth }"
    />

    <div class="waveform__playhead" :style="{ left: headLeft }" />
    <div
      class="waveform__head-grip"
      :style="{ left: headLeft }"
      @pointerdown="startDrag('head', $event)"
    >
      <span class="waveform__head-knob" />
    </div>

    <template v-if="player.loopOn">
      <div
        class="waveform__grip waveform__grip--a"
        :style="{ left: loopLeft }"
        @pointerdown="startDrag('a', $event)"
      >
        <span class="waveform__marker">A</span>
      </div>
      <div
        class="waveform__grip waveform__grip--b"
        :style="{ left: loopRight }"
        @pointerdown="startDrag('b', $event)"
      >
        <span class="waveform__marker">B</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.waveform {
  position: relative;
  height: 104px;
  touch-action: none;
  user-select: none;
  cursor: pointer;
}

.waveform__bars {
  position: absolute;
  inset: 0 0 auto;
  height: var(--wave-height);
  display: flex;
  align-items: center;
  gap: 2px;
}

.waveform__bar {
  flex: 1;
  background: #d4d4d4;

  &.is-played {
    background: #767676;
  }

  &.is-in-loop {
    background: #9a9a9a;
  }

  &.is-in-loop.is-played {
    background: #1a1a1a;
  }
}

.waveform__region {
  position: absolute;
  top: 0;
  height: var(--wave-height);
  pointer-events: none;
  background: rgba(26, 26, 26, 0.07);
  border-left: 1px dashed #1a1a1a;
  border-right: 1px dashed #1a1a1a;
}

.waveform__playhead {
  position: absolute;
  top: -4px;
  height: 84px;
  width: 2px;
  background: #1a1a1a;
  pointer-events: none;
}

.waveform__head-grip {
  position: absolute;
  top: -10px;
  height: 96px;
  width: 48px;
  margin-left: -24px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.waveform__head-knob {
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -7px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #1a1a1a;
}

.waveform__grip {
  position: absolute;
  top: 0;
  height: 104px;
  width: 48px;
  cursor: col-resize;
}

.waveform__grip--a {
  margin-left: -34px;
}

.waveform__grip--b {
  margin-left: -14px;
}

.waveform__marker {
  position: absolute;
  bottom: 2px;
  width: 24px;
  height: 24px;
  border: 1px solid #1a1a1a;
  background: #ffffff;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  .waveform__grip--a & {
    right: 10px;
  }

  .waveform__grip--b & {
    left: 10px;
  }
}

.waveform--desktop {
  height: 176px;

  .waveform__playhead {
    top: -6px;
    height: 152px;
  }

  .waveform__head-grip {
    top: -14px;
    height: 168px;
    width: 40px;
    margin-left: -20px;
  }

  .waveform__grip {
    height: 176px;
    width: 44px;
  }

  .waveform__grip--a {
    margin-left: -32px;
  }

  .waveform__grip--b {
    margin-left: -12px;
  }

  .waveform__marker {
    width: 26px;
    height: 26px;
  }
}
</style>
