<script setup lang="ts">
import AppIcon from './AppIcon.vue';
import { STEP_SECONDS, usePlayerStore } from '@/stores/player';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();

function update(event: Event) {
  player.setSkipSeconds(Number((event.target as HTMLSelectElement).value));
}
</script>

<template>
  <label class="step" :class="`step--${variant}`">
    <span class="step__legend">Step</span>
    <span class="step__line">
      <span class="step__value" aria-hidden="true">{{ player.skipLabel }}</span>
      <AppIcon class="step__caret" name="caret-down" :size="variant === 'desktop' ? 10 : 12" />
      <select
        class="step__select"
        aria-label="Skip step size"
        :value="player.skipSeconds"
        @change="update"
      >
        <option v-for="seconds in STEP_SECONDS" :key="seconds" :value="seconds">
          {{ seconds }} seconds
        </option>
      </select>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

/* A rare preference lives in the chassis rather than among the practice keys.
   Its real select covers the compact printed value, preserving native picker
   and keyboard behaviour without making the longest option set the footprint. */
.step {
  @include well;
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  color: var(--ink);
  cursor: pointer;
}

.step__legend {
  @include legend(10px);
}

.step__line {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.step__value {
  @include figures;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1;
}

.step__select {
  appearance: none;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: transparent;
  font-family: inherit;
  opacity: 0;
  cursor: pointer;
}

.step__caret {
  flex: none;
  color: var(--ink-label);
  pointer-events: none;
}

.step:has(.step__select:focus-visible) {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.step--desktop {
  width: 82px;
  height: 28px;
  padding: 0 8px;

  .step__value {
    font-size: 12px;
  }
}

.step--mobile {
  width: 92px;
  height: 40px;
  padding: 0 12px;

  .step__value {
    font-size: 13px;
  }
}
</style>
