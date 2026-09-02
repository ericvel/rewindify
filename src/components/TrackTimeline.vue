<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue';
import { usePlayerStore, type ScrubKind } from '@/stores/player';
import { generateWaveform } from '@/playback/waveform';
import { formatTime } from '@/playback/time';

const props = withDefaults(
  defineProps<{
    barCount: number;
    fieldHeight: number;
    variant?: 'mobile' | 'desktop';
  }>(),
  { variant: 'mobile' },
);

const player = usePlayerStore();
const trackEl = ref<HTMLElement | null>(null);

/*
 * Recomputed per track, not per frame: the playhead only changes bar classes.
 * Bars are mirrored about the centre line by the field's own alignment, so the
 * height here is the full peak-to-peak extent, not a half-amplitude.
 */
const barHeights = computed(() => {
  const track = player.currentTrack;
  if (!track) return [];
  return generateWaveform(track.seed, props.barCount).map(
    (level) => `${Math.max(2, Math.round(level * props.fieldHeight))}px`,
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

/*
 * The printed scale. A step is picked so the track divides into no more than
 * MAX_DIVISIONS, then every graduation lands on a whole number of seconds — so
 * glancing at the timeline gives a time rather than an impression. Minor marks
 * halve each major division.
 */
const TICK_STEPS = [5, 10, 15, 30, 60, 120, 300, 600];

/*
 * One figure for both breakpoints. Desktop used to ask for eight divisions,
 * which printed a time every thirty seconds and put more numerals inside the
 * recess than the position readout they are meant to sit under. Halving the
 * print costs no precision: the thirty-second graduations are still there as
 * minor marks, only unlabelled, and the numbers the loop is actually set to are
 * printed exactly on the A and B rows.
 */
const MAX_DIVISIONS = 5;

const majorStep = computed(() => {
  const duration = player.duration;
  if (duration <= 0) return 30;
  return TICK_STEPS.find((step) => duration / step <= MAX_DIVISIONS) ?? 600;
});

interface Tick {
  seconds: number;
  left: string;
  label: string | null;
}

const ticks = computed<Tick[]>(() => {
  const duration = player.duration;
  if (duration <= 0) return [];
  const minor = majorStep.value / 2;
  const out: Tick[] = [];
  for (let seconds = 0; seconds <= duration + 0.001; seconds += minor) {
    const isMajor = Math.abs(seconds % majorStep.value) < 0.001;
    out.push({
      seconds,
      left: percent(seconds),
      label: isMajor ? formatTime(seconds) : null,
    });
  }
  return out;
});

/** Edge labels are pulled inside the field so they cannot clip. */
function labelAnchor(tick: Tick) {
  if (tick.seconds === 0) return 'start';
  if (player.duration - tick.seconds < majorStep.value * 0.5) return 'end';
  return 'mid';
}

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
    class="timeline"
    :class="[`timeline--${variant}`, { 'is-armed': player.loopOn }]"
    :style="{ '--field-height': `${fieldHeight}px` }"
    @pointerdown="startDrag('head', $event)"
  >
    <!--
      Mounted whether or not the loop is on, so arming it can sweep the span
      open from its centre rather than having it appear. This is the one
      authored moment in the build; everything else is instant.

      It sits BEFORE the bars so the wash paints behind them. As a later
      sibling it tinted every bar inside the span, and no bar tone could then
      clear 3:1 against both the washed ground above it and the played bar
      below it — the window was shut by 7%. Behind the bars, both pairs clear.
    -->
    <div class="timeline__region" :style="{ left: loopLeft, width: loopWidth }">
      <span class="timeline__region-fill" />
    </div>

    <div class="timeline__bars">
      <div
        v-for="(height, index) in barHeights"
        :key="index"
        class="timeline__bar"
        :class="{
          'is-played': index <= playedBarIndex,
          'is-in-loop': player.loopOn && index >= loopStartBar && index <= loopEndBar,
        }"
        :style="{ height }"
      />
    </div>

    <!-- The printed scale. -->
    <div class="timeline__scale" aria-hidden="true">
      <span
        v-for="tick in ticks"
        :key="tick.seconds"
        class="timeline__tick"
        :class="[tick.label ? 'is-major' : 'is-minor', `is-anchor-${labelAnchor(tick)}`]"
        :style="{ left: tick.left }"
      >
        <span v-if="tick.label" class="timeline__tick-label">{{ tick.label }}</span>
      </span>
    </div>

    <!--
      The bracket, and the loop's real signal. Neither of the devices it
      replaces could be seen: an orange tint over the well is luminance-locked
      at 1.13:1 (see `--accent-wash`), and the 1px accent rules that used to
      mark A and B sat BEHIND the bars at 1.07:1 against an unplayed one, so
      the exact boundary vanished behind any tall bar. Bracketing works
      because it puts the accent where the field leaves the ground clear: the
      bars are mirrored about the centre line, so the top and bottom few pixels
      of the field are bare well almost everywhere, and `accent-strong` reads
      there at 3.85:1. It sits after the scale so a boundary rule outranks a
      graduation, and before the playhead so position outranks both.
    -->
    <div class="timeline__brace" :style="{ left: loopLeft, width: loopWidth }" aria-hidden="true">
      <span class="timeline__rail timeline__rail--top" />
      <span class="timeline__rail timeline__rail--bottom" />
      <span class="timeline__bracket timeline__bracket--a" />
      <span class="timeline__bracket timeline__bracket--b" />
    </div>

    <div class="timeline__playhead" :style="{ left: headLeft }" />
    <div
      class="timeline__head-grip"
      :style="{ left: headLeft }"
      aria-hidden="true"
      @pointerdown="startDrag('head', $event)"
    >
      <span class="timeline__head-knob" />
    </div>

    <!--
      Pointer conveniences for values that LoopNudger already exposes as real
      buttons, so they carry no keyboard path of their own and stay out of the
      accessibility tree rather than posing as controls.
    -->
    <div
      class="timeline__grip timeline__grip--a"
      :style="{ left: loopLeft }"
      aria-hidden="true"
      @pointerdown="startDrag('a', $event)"
    >
      <span class="timeline__marker">A</span>
    </div>
    <div
      class="timeline__grip timeline__grip--b"
      :style="{ left: loopRight }"
      aria-hidden="true"
      @pointerdown="startDrag('b', $event)"
    >
      <span class="timeline__marker">B</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

/*
 * Three stacked bands: a strip for the playhead knob, the bar field, and the
 * printed scale. Overlays are positioned against the whole container using
 * these two heights, so the geometry lives in one place.
 */
.timeline {
  --knob-strip: 16px;
  --scale-strip: 24px;
  --bar-gap: 2px;
  --rail: 3px;
  position: relative;
  height: calc(var(--knob-strip) + var(--field-height) + var(--scale-strip));
  touch-action: none;
  user-select: none;
  cursor: pointer;
}

.timeline__bars {
  position: absolute;
  inset: var(--knob-strip) 0 var(--scale-strip);
  display: flex;
  align-items: center;
  gap: var(--bar-gap);
}

/*
 * The field is pitched coarse on purpose: ~6px bars on a 2px gap. A finer render
 * carried more of the contour but read as busy against a plate whose largest
 * object is meant to be the position readout, so the bars stay chunky enough to
 * be objects rather than texture.
 */
.timeline__bar {
  flex: 1;
  min-width: 1px;
  border-radius: 2px;
  background: var(--timeline-bar);

  &.is-played {
    background: var(--ink);
  }

  /*
   * One variable per channel: bar tone carries played-versus-unplayed, and the
   * accent carries the loop — through the span wash, the rules, the A/B markers,
   * the nudger chips, the legend and the switch. Painting played bars accent
   * INSIDE the span collapsed played against unplayed to 1.24:1, making progress
   * through the passage the least readable thing on the timeline, in the one
   * region this product exists for. The span's lighter washed ground is why
   * in-loop unplayed needs its own tone rather than reusing --timeline-bar.
   */
  &.is-in-loop:not(.is-played) {
    background: var(--timeline-bar-in-loop);
  }
}

.timeline__region {
  position: absolute;
  top: var(--knob-strip);
  height: var(--field-height);
  pointer-events: none;
  /* Position follows the handles instantly; only the fill is animated. */
  transition: none;
}

.timeline__region-fill {
  display: block;
  height: 100%;
  transform: scaleX(0);
  opacity: 0;
  background: var(--accent-wash);
  transition:
    transform var(--arm-duration) var(--ease-out),
    opacity var(--arm-duration) var(--ease-out);
}

.is-armed .timeline__region-fill {
  transform: scaleX(1);
  opacity: 1;
}

/* Exactly the wash's box, so the bracket and the tint mark the same passage. */
.timeline__brace {
  position: absolute;
  top: var(--knob-strip);
  height: var(--field-height);
  pointer-events: none;
  /* Position follows the handles instantly; only the sweep is animated. */
  transition: none;
}

/*
 * The two rails ride the field's edges, where the mirrored bars leave bare
 * ground. They sweep open from the centre on the same tokens as the wash, so
 * arming the loop stays one moment rather than becoming three.
 */
.timeline__rail {
  position: absolute;
  left: 0;
  right: 0;
  height: var(--rail);
  background: var(--accent-strong);
  transform: scaleX(0);
  opacity: 0;
  transition:
    transform var(--arm-duration) var(--ease-out),
    opacity var(--arm-duration) var(--ease-out);
}

.timeline__rail--top {
  top: 0;
}

.timeline__rail--bottom {
  bottom: 0;
}

.is-armed .timeline__rail {
  transform: scaleX(1);
  opacity: 1;
}

/*
 * A boundary rule is a 2px accent core printed with a 1px gutter of the
 * field's own ground either side, and it is centred on the exact point rather
 * than tucked inside the span. The gutter is what makes it readable at all:
 * bare accent over an unplayed bar is 1.07:1, while the ground clears 3.11:1
 * against an unplayed bar and 10.66:1 against a played one, so the mark
 * survives whatever the waveform does behind it. It overshoots each rail by
 * the rail's own thickness — which both carries the point onto the clear
 * ground of the knob and scale strips, and keeps the whole figure reading as a
 * printed bracket rather than as a box around the passage.
 */
.timeline__bracket {
  position: absolute;
  top: calc(var(--rail) * -1);
  bottom: calc(var(--rail) * -1);
  width: 4px;
  background: var(--surface-well);
  opacity: 0;
  transition: opacity var(--arm-duration) var(--ease-out);

  &::after {
    content: '';
    position: absolute;
    inset: 0 1px;
    background: var(--accent-strong);
  }
}

.timeline__bracket--a {
  left: -2px;
}

.timeline__bracket--b {
  right: -2px;
}

/* Behind the sweep, on the same delay as the grips they belong to. */
.is-armed .timeline__bracket {
  opacity: 1;
  transition-delay: 120ms;
}

.timeline__scale {
  position: absolute;
  inset: auto 0 0;
  height: var(--scale-strip);
  border-top: 1px solid var(--surface-edge);
  pointer-events: none;
}

.timeline__tick {
  position: absolute;
  top: 0;
  width: 1px;
  background: var(--surface-edge);

  &.is-major {
    height: 6px;
    background: var(--ink-label);
  }

  &.is-minor {
    height: 3px;
  }
}

.timeline__tick-label {
  @include figures;
  position: absolute;
  top: 8px;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
  color: var(--ink-label);
  white-space: nowrap;

  .is-anchor-mid & {
    left: 50%;
    transform: translateX(-50%);
  }

  .is-anchor-start & {
    left: 0;
  }

  .is-anchor-end & {
    right: 0;
  }
}

.timeline__playhead {
  position: absolute;
  top: 6px;
  bottom: calc(var(--scale-strip) - 4px);
  width: 2px;
  margin-left: -1px;
  background: var(--ink);
  pointer-events: none;
}

.timeline__head-grip {
  position: absolute;
  top: 0;
  height: calc(var(--knob-strip) + var(--field-height));
  width: 44px;
  margin-left: -22px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.timeline__head-knob {
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(var(--cap-top), var(--cap-bottom));
  box-shadow: var(--shadow-cap);
}

/*
 * A and B sit just inside the bar field, above the scale line. They used to
 * straddle it at bottom:-9px, which covered the whole 6px major graduation
 * underneath each chip — a loop point deleting the mark it names, on a surface
 * whose product principle is that position is stated exactly. The bracket
 * rules overshoot into the scale strip instead, so the exact point stays
 * marked on ground nothing else is printed on.
 */
.timeline__grip {
  position: absolute;
  top: var(--knob-strip);
  height: var(--field-height);
  width: 44px;
  cursor: col-resize;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--arm-duration) var(--ease-out);
}

.is-armed .timeline__grip {
  opacity: 1;
  pointer-events: auto;
  transition-delay: 120ms;
}

.timeline__grip--a {
  margin-left: -32px;
}

.timeline__grip--b {
  margin-left: -12px;
}

.timeline__marker {
  @include figures;
  position: absolute;
  bottom: calc(var(--rail) + 1px);
  width: 22px;
  height: 18px;
  border-radius: 2px;
  background: var(--accent-strong);
  color: var(--on-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  /*
   * `accent-strong` against an unplayed bar is 1.24:1 — hue with no luminance
   * under it, so a chip landing mid-field used to dissolve into the waveform.
   * The 1px knockout in the field's own ground gives it an edge wherever it
   * lands, and holds it off the rail it stands on. Hard spread with no blur:
   * the same device as `--shadow-well`'s inset ring, not a halo.
   */
  box-shadow:
    0 0 0 1px var(--surface-well),
    0 1px 2px rgba(31, 31, 29, 0.28);

  .timeline__grip--a & {
    right: 11px;
  }

  .timeline__grip--b & {
    left: 11px;
  }
}

.timeline--desktop {
  --knob-strip: 18px;
  --scale-strip: 26px;

  .timeline__marker {
    width: 24px;
    height: 20px;
    font-size: 12px;
  }

  .timeline__tick-label {
    font-size: 11px;
  }
}
</style>
