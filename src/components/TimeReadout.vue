<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop'; compact?: boolean }>(), {
  variant: 'mobile',
  compact: false,
});

const player = usePlayerStore();
</script>

<template>
  <div
    class="time-readout"
    :class="[`time-readout--${variant}`, { 'time-readout--compact': compact }]"
  >
    <!--
      `aria-label` on an `output` replaces its contents in the name
      computation, so the label said "Current position" and the position
      itself was not in it. The name carries both now — and `aria-live` is
      shut off deliberately: `output` is a status region by default, so a
      screen reader was announcing this figure every second of playback, which
      is the one thing a musician with an instrument in their hands cannot
      talk over.
    -->
    <output class="time-readout__now" aria-live="off" :aria-label="`Position ${player.nowLabel}`">{{
      player.nowLabel
    }}</output>
    <span class="time-readout__end">{{ player.endLabel }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

/*
 * Position is the dominant object on the whole surface. It was 20px next to a
 * 22px track title, which is why nothing on the old panel told the eye where to
 * look; at this size it is readable at arm's length from a music stand and
 * across a desk without hunting for it.
 */
/*
 * The extent is set BESIDE the position, on its baseline, not at the far end of
 * the recess. `space-between` held the two ends of the panel apart, which meant
 * the size of the gap between two halves of one printed statement was set by the
 * window: 250px on a phone and 871px at 1440, where the figure read as a stray
 * label in the corner rather than as the qualifier on the numeral. Packed left,
 * the pair is one object at every width, and the recess keeps the single
 * alignment edge everything else on this surface is packed against.
 */
.time-readout {
  display: flex;
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

/*
 * Two steps, and the wide band takes the desktop one rather than inventing a
 * third. A 46px clock inside an 800px-wide recess is not a focal point, it is a
 * caption — and being the largest object on the plate is the whole reason the
 * Position role exists.
 */
@mixin readout-large {
  /* The pairing gap steps with the numeral it hangs off. */
  gap: 14px;
  padding-bottom: 18px;

  .time-readout__now {
    font-size: 64px;
  }

  .time-readout__end {
    font-size: 14px;
  }
}

.time-readout--desktop {
  @include readout-large;
}

.time-readout--mobile {
  @include screen-wide {
    @include readout-large;
  }
}

/* Same phone type step, reused when height rather than width is scarce. */
.time-readout--compact {
  padding-bottom: 10px;

  .time-readout__now {
    font-size: 46px;
  }

  .time-readout__end {
    font-size: 13px;
  }
}
</style>
