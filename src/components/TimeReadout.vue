<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();
</script>

<template>
  <div class="time-readout" :class="`time-readout--${variant}`">
    <output class="time-readout__now" aria-label="Current position">{{ player.nowLabel }}</output>
    <span class="time-readout__end">{{ player.endLabel }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

/*
 * Position is the dominant object on the whole surface. It was 20px next to a
 * 22px track title, which is why nothing on the old panel told the eye where to
 * look; at this size it is readable at arm's length from a music stand and
 * across a desk without hunting for it.
 */
.time-readout {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 14px;
}

.time-readout__now {
  @include figures;
  font-size: 46px;
  font-weight: 500;
  line-height: 0.9;
  letter-spacing: -0.03em;
  color: var(--ink);
}

.time-readout__end {
  @include figures;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--ink-label);
}

.time-readout--desktop {
  padding-bottom: 18px;

  .time-readout__now {
    font-size: 64px;
  }

  .time-readout__end {
    font-size: 14px;
  }
}
</style>
