<script setup lang="ts">
/**
 * The drawer's handle, sitting in the loop group beside the switch.
 *
 * Its material is `cap-light()` because recalling a stored span is a thing you
 * press often, not constantly and not almost never — the Frequency Sets
 * Material Rule puts it on exactly the same footing as the loop switch it
 * stands next to, and it takes that switch's label register so the pair reads
 * as one group rather than as two unrelated controls.
 *
 * It printed `PASSAGES` first, and that word was the one thing on this plate
 * with no relation to anything else printed on it: the switch beside it says
 * LOOP, the status bar says LOOP and MOVE LOOP, and the drawer this handle
 * opens calls the same rows "saved". `SAVED LOOPS` says what a row is in the
 * vocabulary the switch has already taught — two words rather than one so it
 * cannot be scanned as that switch — and leaves *passage* to mean the music,
 * which is the only job that word does well.
 *
 * A disclosure needs to show which way it is set, and this world already has
 * the device: a cap whose drawer is open is pressed and stays pressed, the way
 * a held A/B keycap does. So the open state is the cap's own press held down —
 * no caret, no new glyph, no second vocabulary.
 *
 * The count is the only thing telling you a closed drawer has anything in it,
 * which is what earns it a printed figure under the Say-It-Once Rule: it owns
 * "how many are stored", nothing else prints that, and it changes whether the
 * user opens the band at all.
 */
import { computed } from 'vue';
import { usePlayerStore } from '@/stores/player';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();

const count = computed(() => player.trackSavedLoops.length);
</script>

<template>
  <button
    id="saved-loops-toggle"
    type="button"
    class="saved-loops-toggle"
    :class="[`saved-loops-toggle--${variant}`, { 'is-open': player.savedLoopsOpen }]"
    :aria-expanded="player.savedLoopsOpen"
    aria-controls="saved-loops-band"
    @click="player.toggleSavedLoops()"
  >
    <span class="saved-loops-toggle__label">Saved loops</span>
    <template v-if="count > 0">
      <span class="saved-loops-toggle__separator" aria-hidden="true">·</span>
      <span class="saved-loops-toggle__count">{{ count }}</span>
    </template>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.saved-loops-toggle {
  @include cap-light;
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
  text-align: left;
  white-space: nowrap;
}

/*
 * A cap whose drawer is open is pressed and stays pressed, the way a held A/B
 * keycap is — and it takes that convention's *depth*, one step past the
 * momentary press, for the reason `--shadow-key-held` exists: at press depth a
 * sustained state is too quiet to read as a state at all. Its ground drops to
 * the plate as well, so the handle stops catching light from above the way the
 * raised caps beside it still do.
 */
.is-open {
  transform: translateY(1px);
  background: var(--surface-plate);
  box-shadow:
    var(--shadow-cap-light-held),
    inset 0 0 0 1px var(--surface-edge);
}

/* The loop switch's label register exactly, so the two read as one group. */
.saved-loops-toggle__label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--ink);
}

.saved-loops-toggle__separator {
  font-size: 12px;
  line-height: 1;
  color: var(--ink-label);
}

.saved-loops-toggle__count {
  @include figures;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
  color: var(--ink-label);
}

/* Matched to the loop switch's height at both steps: a ragged row of controls
   is the first thing that stops a panel reading as machined. */
.saved-loops-toggle--mobile {
  height: 62px;
  padding: 0 16px;
}

.saved-loops-toggle--desktop {
  height: 52px;
  padding: 0 15px;

  .saved-loops-toggle__label {
    font-size: 12px;
  }
}

@media (hover: hover) {
  .saved-loops-toggle:not(.is-open):hover {
    background: linear-gradient(var(--surface-hi), var(--surface-raised));
  }
}
</style>
