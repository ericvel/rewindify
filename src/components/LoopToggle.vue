<script setup lang="ts">
/**
 * The loop's own control: a cell in the nudger's band at both steps.
 *
 * It used to be a cap of its own — 123px at the far end of the desktop
 * controls row, and a full-width band on the phone shared with the passages
 * handle. Both read it as a peer of that handle, which is a different job:
 * the handle recalls stored spans, this arms the live one. It is now a recess
 * standing with A and B, and its material says so — the A/B rows are wells,
 * so this is a well, and the group's membership outranks the press frequency
 * that would otherwise have made it a cap.
 *
 * The phone cell stands against both rows at once, and its switch runs
 * vertically so that height is travel rather than air: a 116px bay holding a
 * 28px horizontal track was a slot with a control parked in it. Up is armed,
 * the way a slide switch on a panel reads. Desktop keeps the horizontal track,
 * because there the cell is one 52px row tall and there is no long axis to use.
 *
 * Both steps sit on the well rather than the plate, which is why the armed
 * track is `accent-strong` at both: `accent` is 2.91:1 against that ground.
 */
import { usePlayerStore } from '@/stores/player';

const props = withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), {
  variant: 'mobile',
});

const player = usePlayerStore();
</script>

<template>
  <button
    type="button"
    class="loop"
    :class="[`loop--${props.variant}`, { 'is-on': player.loopOn }]"
    :aria-pressed="player.loopOn"
    @click="player.toggleLoop()"
  >
    <!-- Nomenclature and a switch, and nothing else. The label carries the
         state in accent ink; the passage's own two ends are printed on the
         nudger rows, where they are changed. -->
    <span class="loop__label">Loop</span>
    <span class="loop__switch" aria-hidden="true">
      <span class="loop__knob" />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

/*
 * Cut into the plate at the size of a nudger row, so the switch reads as a
 * member of the loop group rather than as a control parked at a row's end. The
 * word sits over the mechanism because the cell is a column: there is no room
 * beside it at this width, and stacking is what lets the cell cost the layout
 * no band of its own at either step.
 */
.loop {
  @include well;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: none;
}

/* Printed nomenclature, not a word on a cap: the cell is a recess, and 10px
   tracked legend is the register this system prints on one. */
.loop__label {
  @include legend(10px);
  transition: color var(--arm-duration) var(--ease-out);
}

.is-on .loop__label {
  color: var(--accent-text);
}

/*
 * A slide switch: a well cut into the cell's own well, with a raised knob
 * riding in it. The track floor is Deep Well, the role that exists for a
 * recess inside a recess. Each step sets its own axis and its own travel; the
 * radius follows the short axis either way, per the Half-Height Pill Rule.
 */
.loop__switch {
  position: relative;
  flex: none;
  background: var(--surface-well-deep);
  box-shadow: var(--shadow-well);
  transition:
    background-color var(--arm-duration) var(--ease-out),
    box-shadow var(--press-duration) ease;
}

/*
 * Measured against the well it is cut into, not the plate: `accent` is 2.91:1
 * there and `accent-strong` is 3.85:1. The same value the A/B chips beside it
 * take, for the same reason.
 */
.is-on .loop__switch {
  background: var(--accent-strong);
}

.loop__knob {
  position: absolute;
  left: 3px;
  border-radius: 50%;
  background: linear-gradient(var(--cap-top), var(--cap-bottom));
  box-shadow: var(--shadow-cap);
}

/*
 * The phone cell stretches over both stacked rows, so it takes no height of
 * its own; in the wide band it is one row tall beside them. A larger track
 * than desktop's, because this is the touch step.
 */
/*
 * The bay is as tall as the two rows it stands against, so the switch runs up
 * it. The word goes under the track rather than over it: the knob's resting
 * place is the bottom of the track, and a legend above would have sat at the
 * far end of the cell from the thing it names.
 */
.loop--mobile {
  align-self: stretch;
  flex-direction: column-reverse;
  gap: 8px;
  padding: 12px 11px;

  /* 26px wide → a 13px radius, half the short axis: the one the knob's own
     diameter fills. 68px of travel is what the bay's height buys. */
  .loop__switch {
    width: 26px;
    height: 68px;
    border-radius: 13px;
    transition:
      background-color var(--arm-duration) var(--ease-out),
      box-shadow var(--press-duration) ease;
  }

  .loop__knob {
    bottom: 3px;
    width: 20px;
    height: 20px;
    transition: bottom var(--arm-duration) var(--ease-out);
  }

  /* Up is armed. Measured off the far edge so the travel follows the track's
     height rather than restating it. */
  &.is-on .loop__knob {
    bottom: calc(100% - 23px);
  }

  /*
   * The vertical track is what the phone's two-row bay is for. In the wide
   * band the bay is one row tall beside the pair, so there is no long axis to
   * run up — and a 110px switch would have set the row height for the two A/B
   * rows next to it. It lies down again here, at the touch step.
   */
  @include screen-wide {
    flex-direction: column;
    padding: 0 11px;

    /* Desktop's track exactly: horizontal, the switch is the mechanism inside
       the button rather than the button itself, and the bay it sits in is
       56×54 — so the affordance clears 40px in both axes on a touch tablet
       even though the track does not. */
    .loop__switch {
      width: 34px;
      height: 18px;
      border-radius: 9px;
    }

    .loop__knob {
      top: 3px;
      bottom: auto;
      width: 12px;
      height: 12px;
      transition: left var(--arm-duration) var(--ease-out);
    }

    &.is-on .loop__knob {
      bottom: auto;
      left: 19px;
    }
  }
}

.loop--desktop {
  gap: 7px;
  height: 52px;
  padding: 0 11px;

  .loop__switch {
    width: 34px;
    height: 18px;
    border-radius: 9px;
  }

  .loop__knob {
    top: 3px;
    width: 12px;
    height: 12px;
    transition: left var(--arm-duration) var(--ease-out);
  }

  &.is-on .loop__knob {
    left: 19px;
  }
}

/* A recessed control cannot press down, so the hover deepens the track it
   already has. Same alpha the light cap uses for its own sustained press. */
@media (hover: hover) {
  .loop:hover .loop__switch {
    box-shadow:
      inset 0 1px 3px rgba(88, 80, 64, 0.26),
      inset 0 0 0 1px var(--surface-edge);
  }
}
</style>
