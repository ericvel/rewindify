<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { formatTime } from '@/playback/time'

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' })

const player = usePlayerStore()

const points = computed(() => [
  { key: 'a' as const, label: 'A', time: formatTime(player.displayLoopA) },
  { key: 'b' as const, label: 'B', time: formatTime(player.displayLoopB) },
])
</script>

<template>
  <div class="nudger" :class="`nudger--${variant}`">
    <div v-for="point in points" :key="point.key" class="nudger__row">
      <div class="nudger__readout">
        <span class="nudger__point">{{ point.label }}</span>
        <span class="nudger__time">{{ point.time }}</span>
      </div>
      <button
        type="button"
        class="nudger__step"
        :aria-label="`Nudge ${point.label} back 1 second`"
        @click="player.nudge(point.key, -1)"
      >
        −
      </button>
      <button
        type="button"
        class="nudger__step"
        :aria-label="`Nudge ${point.label} forward 1 second`"
        @click="player.nudge(point.key, 1)"
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.nudger {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: none;
}

.nudger__row {
  display: flex;
  align-items: stretch;
  height: 56px;
  border: 1px solid #9a9a9a;
  background: #ffffff;
}

.nudger__readout {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding-left: 12px;
}

.nudger__point {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #767676;
}

.nudger__time {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  color: #1a1a1a;
}

.nudger__step {
  width: 44px;
  flex: none;
  border-left: 1px solid #d4d4d4;
  background: #ffffff;
  font-family: ui-monospace, monospace;
  font-size: 16px;
  color: #1a1a1a;

  &:active {
    background: #eaeaea;
  }
}

.nudger--desktop {
  display: flex;
  gap: 12px;

  .nudger__row {
    height: 48px;
  }

  // Point and time sit side by side rather than stacked.
  .nudger__readout {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
  }

  .nudger__step {
    width: 40px;
    font-size: 14px;
  }
}

@media (hover: hover) {
  .nudger--desktop .nudger__step:hover {
    background: #f5f5f5;
  }
}
</style>
