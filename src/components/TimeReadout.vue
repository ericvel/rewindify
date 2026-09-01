<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' })

const player = usePlayerStore()
</script>

<template>
  <div class="time-readout" :class="`time-readout--${variant}`">
    <span class="time-readout__now">{{ player.nowLabel }}</span>
    <span class="time-readout__end">{{ player.endLabel }}</span>
  </div>
</template>

<style scoped lang="scss">
.time-readout {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 2px 12px;
}

.time-readout__now {
  font-family: ui-monospace, monospace;
  font-size: 20px;
  color: #1a1a1a;
}

.time-readout__end {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #767676;
}

.time-readout--desktop {
  padding-bottom: 16px;

  .time-readout__now {
    font-size: 26px;
  }

  .time-readout__end {
    font-size: 13px;
  }
}
</style>
