<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import { usePlayerStore } from '@/stores/player';
import { formatTime } from '@/playback/time';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();

const points = computed(() => [
  { key: 'a' as const, label: 'A', name: 'Loop start', time: formatTime(player.displayLoopA) },
  { key: 'b' as const, label: 'B', name: 'Loop end', time: formatTime(player.displayLoopB) },
]);
</script>

<template>
  <div class="nudger" :class="[`nudger--${variant}`, { 'is-armed': player.loopOn }]">
    <div v-for="point in points" :key="point.key" class="nudger__row">
      <!-- The chip matches its marker on the timeline, so the two read as one
           control at two scales. It takes the accent only once the loop is on. -->
      <span class="nudger__chip">{{ point.label }}</span>
      <span class="nudger__time">{{ point.time }}</span>
      <!-- Printed nomenclature, carried to the keys on a leader the same way the
           track index carries a title to its duration. Fills a row that read as
           an unfinished field, and says which end of the passage this is. -->
      <span class="nudger__leader" aria-hidden="true" />
      <span class="nudger__name">{{ point.name }}</span>
      <div class="nudger__steps">
        <button
          type="button"
          class="nudger__step"
          :aria-label="`Nudge ${point.label} back 1 second`"
          @click="player.nudge(point.key, -1)"
        >
          <AppIcon name="minus" :size="16" />
        </button>
        <button
          type="button"
          class="nudger__step"
          :aria-label="`Nudge ${point.label} forward 1 second`"
          @click="player.nudge(point.key, 1)"
        >
          <AppIcon name="plus" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

/*
 * Stacked on the phone. Side by side, each row had 166px to fit a chip, a time
 * and two keys, which clipped the B row off the right edge and forced the keys
 * down to 32px — under a comfortable tap target for someone holding a guitar.
 * Full width buys 40px keys and spends the empty plate above the transport.
 */
.nudger {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  flex: none;
}

.nudger__row {
  @include well;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  height: 54px;
  padding: 0 7px 0 12px;
}

.nudger__chip {
  @include figures;
  flex: none;
  width: 22px;
  height: 18px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: var(--surface-well-deep);
  color: var(--ink-label);
  transition:
    background-color var(--arm-duration) var(--ease-out),
    color var(--arm-duration) var(--ease-out);
}

.is-armed .nudger__chip {
  background: var(--accent-strong);
  color: var(--on-accent);
}

.nudger__time {
  @include figures;
  flex: none;
  min-width: 0;
  overflow: hidden;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.nudger__leader {
  flex: 1;
  min-width: 8px;
  border-bottom: 1px dotted var(--surface-edge);
  transform: translateY(-4px);
}

.nudger__name {
  @include legend(10px);
  flex: none;
  padding-right: 4px;
}

.nudger__steps {
  flex: none;
  display: flex;
  gap: 6px;
}

.nudger__step {
  @include cap-light;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: var(--ink);
}

.nudger--desktop {
  display: flex;
  gap: 10px;

  /* Content-sized on desktop: the controls row wraps rather than squashing. */
  .nudger__row {
    flex: none;
    gap: 9px;
    height: 52px;
    padding: 0 6px 0 11px;
  }

  /* No room for nomenclature in a compact row, and no empty field to fill. */
  .nudger__leader,
  .nudger__name {
    display: none;
  }

  .nudger__time {
    font-size: 16px;
  }

  .nudger__step {
    width: 34px;
    height: 34px;
  }
}

@media (hover: hover) {
  .nudger__step:hover {
    background: linear-gradient(var(--surface-hi), var(--surface-raised));
  }
}
</style>
