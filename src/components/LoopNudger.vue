<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import LoopToggle from './LoopToggle.vue';
import { usePlayerStore } from '@/stores/player';
import { formatTime } from '@/playback/time';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();

const points = computed(() => [
  { key: 'a' as const, label: 'A', time: formatTime(player.displayLoopA) },
  { key: 'b' as const, label: 'B', time: formatTime(player.displayLoopB) },
]);
</script>

<template>
  <div class="nudger" :class="[`nudger--${variant}`, { 'is-armed': player.loopOn }]">
    <!-- The loop's switch is the group's own cell at both steps, so the control
         that arms the passage sits beside the two ends that define it rather
         than at the far end of a row. On the phone it stands against both rows
         at once; on desktop it leads them. -->
    <LoopToggle class="nudger__arm" :variant="variant" />
    <div v-for="point in points" :key="point.key" class="nudger__row">
      <!-- The chip matches its marker on the timeline, so the two read as one
           control at two scales. It takes the accent only once the loop is on. -->
      <span class="nudger__chip">{{ point.label }}</span>
      <span class="nudger__time">{{ point.time }}</span>
      <!-- The chip is the only thing that names this end now. `Loop start` and
           `Loop end` were printed here on a dotted leader; the width they took
           is what the switch's cell now stands in, and the nudge keys still
           speak the end in full to a screen reader. -->
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
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

/*
 * Stacked on the phone, with the loop's switch standing against both rows at
 * once in a column of its own. Side by side, each row had 166px to fit a chip,
 * a time and two keys, which clipped the B row off the right edge and forced
 * the keys down to 32px — under a comfortable tap target for someone holding a
 * guitar. Stacked, and with the printed nomenclature gone, a row needs about
 * 195px and has 212px at the narrowest phone.
 */
.nudger {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  flex: none;
}

/*
 * The switch is one cell beside two rows, not a row of its own: a leading band
 * would have cost the column a third 54px stripe, which is the height this
 * whole arrangement exists to avoid.
 */
.nudger__arm {
  grid-row: 1 / span 2;
  grid-column: 1;
}

/*
 * Side by side once the plate is wide enough for both rows and the switch — the
 * pair is one control with two ends, and stacking them on a 700px plate spent a
 * second 54px band saying so. The switch takes its own row height here and
 * leads them, the way it does on desktop.
 */
.nudger--mobile {
  @include screen-wide {
    grid-template-columns: auto 1fr 1fr;
    gap: 10px;

    .nudger__arm {
      grid-row: auto;
    }
  }
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

/* The keys keep to the row's right edge; the leader used to do this by being
   the flexible thing between them and the time. */
.nudger__steps {
  flex: none;
  margin-left: auto;
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

  .nudger__arm {
    grid-row: auto;
  }

  /* Content-sized on desktop: the controls row wraps rather than squashing. */
  .nudger__row {
    flex: none;
    gap: 9px;
    height: 52px;
    padding: 0 6px 0 11px;
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
