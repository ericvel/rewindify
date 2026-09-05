<script setup lang="ts">
/**
 * The gate's demonstration: the product's one claim, run rather than stated.
 *
 * A visitor on `/sign-in` has never seen the instrument — the shared-link case
 * is a stranger arriving cold — and the screen that has to sell the thing was
 * the one screen carrying none of it. So the working panel comes to the gate
 * with the field in it, and the field plays a scripted session. A first visit
 * opens just before A with the loop clear; crossing A arms it, the passage
 * wraps at B twice, the loop releases, and playback carries on to the end
 * before the track starts over.
 *
 * The head only ever moves forward under its own steam. It jumps in exactly two
 * places, and both are events the product owns: the loop wrapping at B, and the
 * track ending. A demonstration of the fixed-size step was tried here first and
 * cut — an unexplained cut backwards mid-track reads as a broken animation, not
 * as a control, because nothing on this surface shows the press that caused it.
 *
 * It is a depiction of this product's own surface, not a player: no track, no
 * artwork, no title, nothing claiming to be Spotify data, no control posing as
 * a control. `aria-hidden` and inert, because there is nothing here to operate.
 *
 * Deliberately NOT `TrackTimeline.vue`. That component is the real instrument —
 * bound to the player store, draggable, and the owner of the interactive
 * geometry. Wiring a fake store into it to make a picture would put demo
 * branches inside the thing the product exists for. This is the picture; the
 * devices it draws with (wash behind bars, bracket in front, ink playhead,
 * printed scale) are the system's, and if those change this follows.
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { generateWaveform } from '@/playback/waveform';
import { formatTime } from '@/playback/time';
import { useBarCount } from '@/composables/useBarCount';

/**
 * The demo field's extent. Ninety seconds divides into three graduations under
 * the player's own rule, so the printed scale reads exactly as the app's does
 * and every minor mark still lands on a whole second.
 */
const DURATION = 90;

/*
 * Fixed, so the gate has one face rather than a different one per visit — and
 * chosen rather than typed. Swept against the two bar counts this field
 * actually renders (41 on the phone, 55 on the plate) for a shape with body but
 * still a silhouette: a mean around 0.65, roughly a fifth of the bars near
 * peak, real level contrast between the thirds, and no hole where the armed
 * passage sits. The seed that shipped first was one of the flattest available,
 * and the hero field read as sparse because of it.
 */
const SEED = 2179;

/** Demo seconds per real second. The head has to be watchable, not truthful. */
const RATE = 8;

/*
 * The passage: twenty-four seconds, a bit over a quarter of the field. Narrower
 * than this and the bracket closes into a box — the two boundary rules land
 * near enough to each other to read as an outline around the span rather than
 * as two marks on it, which is the one figure this system does not draw.
 */
const LOOP_A = 36;
const LOOP_B = 60;

interface Beat {
  from: number;
  to: number;
  armed: boolean;
}

/*
 * The session, in demo seconds. One pass down the track, with the loop arming
 * immediately after A and releasing at B after the second wrap. The only cuts
 * are the wrap itself and the track running out.
 */
const SCRIPT: Beat[] = [
  { from: 0, to: LOOP_A, armed: false },
  // This beat owns positions beyond A; the exact boundary stays unarmed.
  { from: LOOP_A, to: LOOP_B, armed: true },
  { from: LOOP_A, to: LOOP_B, armed: true },
  // Released at B, and playback carries on past it — which is what looping prevents.
  { from: LOOP_B, to: DURATION, armed: false },
];

const BEATS = SCRIPT.map((beat) => ({ ...beat, seconds: (beat.to - beat.from) / RATE }));
const CYCLE = BEATS.reduce((total, beat) => total + beat.seconds, 0);

/** Four demo seconds gives the visitor a clear half-second before the head crosses A. */
const ENTRY_LEAD = 4;
const ENTRY = (LOOP_A - ENTRY_LEAD) / RATE;

/** The frame a still visitor gets: armed, head inside the passage. */
const RESTING = { position: 48, armed: true };

/*
 * The head is a value that ticks, exactly as it is in the player — never a
 * transition — so `prefers-reduced-motion` cannot reach it through the motion
 * tokens. It is stopped here instead, and read before the first paint rather
 * than on mount, so a still visitor never sees a frame of the script before it
 * is put away.
 */
const stillness =
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

const fieldEl = useTemplateRef<HTMLElement>('field');
const barCount = useBarCount(fieldEl);

const elapsed = ref(ENTRY);
const running = ref(!(stillness?.matches ?? false));

const LAST = BEATS[BEATS.length - 1];

const frame = computed(() => {
  if (!running.value) return RESTING;
  let remaining = elapsed.value;
  for (const beat of BEATS) {
    if (remaining <= beat.seconds) {
      return {
        position: beat.from + (beat.to - beat.from) * (remaining / beat.seconds),
        armed: beat.armed,
      };
    }
    remaining -= beat.seconds;
  }
  // Only reachable on a rounding edge at the very end of the cycle.
  return { position: LAST?.to ?? RESTING.position, armed: LAST?.armed ?? false };
});

/*
 * Percent heights, not pixels: the field is 94px on the phone and 116px on a
 * wide plate, and a bar that reads its own share of the inset bar envelope
 * keeps that a CSS decision. `max(2px, …)` holds the player's floor while a
 * peak of 1 still leaves clear ground inside the loop rails.
 */
const barHeights = computed(() =>
  generateWaveform(SEED, barCount.value).map((level) => `max(2px, ${(level * 100).toFixed(2)}%)`),
);

function barAt(seconds: number) {
  return (seconds / DURATION) * barCount.value - 0.5;
}

const playedBarIndex = computed(() => Math.floor(barAt(frame.value.position)));
const loopStartBar = computed(() => Math.ceil(barAt(LOOP_A)));
const loopEndBar = computed(() => Math.floor(barAt(LOOP_B)));

function percent(seconds: number) {
  return `${(seconds / DURATION) * 100}%`;
}

const headLeft = computed(() => percent(frame.value.position));
const loopLeft = percent(LOOP_A);
const loopWidth = percent(LOOP_B - LOOP_A);

/*
 * The player's scale rule, applied to a fixed duration: pick the step that
 * divides the track into at most five, label those, and halve each division
 * with an unlabelled minor.
 */
const TICK_STEPS = [5, 10, 15, 30, 60, 120, 300, 600];
const MAX_DIVISIONS = 5;
const MAJOR = TICK_STEPS.find((step) => DURATION / step <= MAX_DIVISIONS) ?? 600;

const TICKS = Array.from({ length: Math.floor(DURATION / (MAJOR / 2)) + 1 }, (_, index) => {
  const seconds = index * (MAJOR / 2);
  return {
    seconds,
    left: percent(seconds),
    label: seconds % MAJOR === 0 ? formatTime(seconds) : null,
    anchor: seconds === 0 ? 'start' : DURATION - seconds < MAJOR * 0.5 ? 'end' : 'mid',
  };
});

let raf = 0;
let last = 0;

function tick(now: number) {
  /*
   * Real elapsed time between frames, not a fixed increment: the script is
   * paced in seconds, so a slow frame has to advance the head further rather
   * than run the session in slow motion. Only a gap long enough to be a
   * backgrounded tab is dropped, so returning to the tab resumes where the
   * head was instead of jumping a cycle.
   */
  const delta = last ? (now - last) / 1000 : 0;
  last = now;
  if (delta < 1) elapsed.value = (elapsed.value + delta) % CYCLE;
  raf = requestAnimationFrame(tick);
}

/*
 * Idempotent, because it is both the mount path and the answer to the query
 * changing under a running clock. A still visitor keeps the frame that carries
 * the claim: the passage armed, the head inside it.
 */
function sync() {
  const still = stillness?.matches ?? false;
  running.value = !still;
  cancelAnimationFrame(raf);
  raf = 0;
  last = 0;
  if (!still) raf = requestAnimationFrame(tick);
}

onMounted(() => {
  sync();
  stillness?.addEventListener('change', sync);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  stillness?.removeEventListener('change', sync);
});
</script>

<template>
  <div ref="field" class="demo" :class="{ 'is-armed': frame.armed }" aria-hidden="true">
    <!-- Before the bars, so the wash paints behind them; see TrackTimeline. -->
    <div class="demo__region" :style="{ left: loopLeft, width: loopWidth }">
      <span class="demo__region-fill" />
    </div>

    <div class="demo__bars">
      <div
        v-for="(height, index) in barHeights"
        :key="index"
        class="demo__bar"
        :class="{
          'is-played': index <= playedBarIndex,
          'is-in-loop': frame.armed && index >= loopStartBar && index <= loopEndBar,
        }"
        :style="{ height }"
      />
    </div>

    <div class="demo__scale">
      <span
        v-for="tick in TICKS"
        :key="tick.seconds"
        class="demo__tick"
        :class="[tick.label ? 'is-major' : 'is-minor', `is-anchor-${tick.anchor}`]"
        :style="{ left: tick.left }"
      >
        <span v-if="tick.label" class="demo__tick-label">{{ tick.label }}</span>
      </span>
    </div>

    <!-- The loop's signal, in front of the bars and after the scale. -->
    <div class="demo__brace" :style="{ left: loopLeft, width: loopWidth }">
      <span class="demo__rail demo__rail--top" />
      <span class="demo__rail demo__rail--bottom" />
      <span class="demo__bracket demo__bracket--a" />
      <span class="demo__bracket demo__bracket--b" />
      <span class="demo__marker demo__marker--a">A</span>
      <span class="demo__marker demo__marker--b">B</span>
    </div>

    <div class="demo__playhead" :style="{ left: headLeft }" />
    <div class="demo__head-knob" :style="{ left: headLeft }" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

.demo {
  --knob-strip: 16px;
  --field-height: 94px;
  --scale-strip: 24px;
  --bar-gap: 2px;
  --rail: 3px;
  --bar-edge-air: 3px;
  /* 120ms, as a fraction of the sweep it comes in behind — the player's own
     derivation, for the same reason: a literal delay outlives the durations
     `prefers-reduced-motion` zeroes at `:root`. */
  --behind-sweep: calc(var(--arm-duration) * 0.375);
  position: relative;
  height: calc(var(--knob-strip) + var(--field-height) + var(--scale-strip));
  /* Nothing here is operable, so nothing here takes a pointer or a caret. */
  pointer-events: none;
  user-select: none;

  @include screen-wide-up {
    --knob-strip: 18px;
    --field-height: 116px;
    --scale-strip: 26px;
  }

  /*
   * A short plate — a landscape phone, a half-height window — has to keep the
   * key on screen, and the field is the one thing on the gate that can give up
   * height without giving up what it says. Last, so it wins on a plate that is
   * both wide and short. A height, not one of the two layout boundaries, which
   * is why it is stated here rather than in `media-queries`.
   */
  @media (height < 700px) {
    --field-height: 72px;
  }
}

.demo__bars {
  position: absolute;
  inset: calc(var(--knob-strip) + var(--rail) + var(--bar-edge-air)) 0
    calc(var(--scale-strip) + var(--rail) + var(--bar-edge-air));
  display: flex;
  align-items: center;
  gap: var(--bar-gap);
}

.demo__bar {
  flex: 1;
  min-width: 1px;
  border-radius: 2px;
  background: var(--timeline-bar);

  &.is-played {
    background: var(--ink);
  }

  &.is-in-loop:not(.is-played) {
    background: var(--timeline-bar-in-loop);
  }
}

.demo__region {
  position: absolute;
  top: var(--knob-strip);
  height: var(--field-height);
}

.demo__region-fill {
  display: block;
  height: 100%;
  transform: scaleX(0);
  opacity: 0;
  background: var(--accent-wash);
  transition:
    transform var(--arm-duration) var(--ease-out),
    opacity var(--arm-duration) var(--ease-out);
}

.is-armed .demo__region-fill {
  transform: scaleX(1);
  opacity: 1;
}

.demo__brace {
  position: absolute;
  top: var(--knob-strip);
  height: var(--field-height);
}

.demo__rail {
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

.demo__rail--top {
  top: 0;
}

.demo__rail--bottom {
  bottom: 0;
}

.is-armed .demo__rail {
  transform: scaleX(1);
  opacity: 1;
}

/* A 2px accent core with a 1px gutter of the field's own ground either side. */
.demo__bracket {
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

.demo__bracket--a {
  left: -2px;
}

.demo__bracket--b {
  right: -2px;
}

.demo__marker {
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
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--arm-duration) var(--ease-out);
  /* Knockout, not a halo: hue alone is 1.24:1 over an unplayed bar. */
  box-shadow:
    0 0 0 1px var(--surface-well),
    0 1px 2px rgba(31, 31, 29, 0.28);

  @include screen-wide-up {
    width: 24px;
    height: 20px;
    font-size: 12px;
  }
}

/*
 * Each marker straddles its own boundary rule by 1px, the offset the player's
 * grips give them: the chip hangs outside the passage and its inner edge lands
 * on the point it names.
 */
.demo__marker--a {
  right: calc(100% - 1px);
}

.demo__marker--b {
  left: calc(100% - 1px);
}

/* Behind the sweep, on the delay the player's brackets take. */
.is-armed .demo__bracket,
.is-armed .demo__marker {
  opacity: 1;
  transition-delay: var(--behind-sweep);
}

.demo__scale {
  position: absolute;
  inset: auto 0 0;
  height: var(--scale-strip);
  border-top: 1px solid var(--surface-edge);
}

.demo__tick {
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

.demo__tick-label {
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

  @include screen-wide-up {
    font-size: 11px;
  }
}

/* Position is never eased, here or in the player. */
.demo__playhead {
  position: absolute;
  top: 6px;
  bottom: calc(var(--scale-strip) - 4px);
  width: 2px;
  margin-left: -1px;
  background: var(--ink);
}

.demo__head-knob {
  position: absolute;
  top: 0;
  margin-left: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(var(--cap-top), var(--cap-bottom));
  box-shadow: var(--shadow-cap);
}
</style>
