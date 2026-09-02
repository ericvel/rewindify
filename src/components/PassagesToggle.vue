<script setup lang="ts">
/**
 * The drawer's handle, sitting in the loop group beside the switch.
 *
 * Its material is `cap-light()` because recalling a passage is a thing you
 * press often, not constantly and not almost never — the Frequency Sets
 * Material Rule puts it on exactly the same footing as the loop switch it
 * stands next to, and it takes that switch's label register so the pair reads
 * as one group rather than as two unrelated controls.
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

const count = computed(() => player.trackPassages.length);
</script>

<template>
  <button
    id="passages-toggle"
    type="button"
    class="passages-toggle"
    :class="[`passages-toggle--${variant}`, { 'is-open': player.passagesOpen }]"
    :aria-expanded="player.passagesOpen"
    aria-controls="passages-band"
    @click="player.togglePassages()"
  >
    <span class="passages-toggle__label">Passages</span>
    <template v-if="count > 0">
      <span class="passages-toggle__separator" aria-hidden="true">·</span>
      <span class="passages-toggle__count">{{ count }}</span>
    </template>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.passages-toggle {
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
.passages-toggle__label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--ink);
}

.passages-toggle__separator {
  font-size: 12px;
  line-height: 1;
  color: var(--ink-label);
}

.passages-toggle__count {
  @include figures;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
  color: var(--ink-label);
}

/* Matched to the loop switch's height at both steps: a ragged row of controls
   is the first thing that stops a panel reading as machined. */
.passages-toggle--mobile {
  height: 62px;
  padding: 0 16px;
}

.passages-toggle--desktop {
  height: 52px;
  padding: 0 15px;

  .passages-toggle__label {
    font-size: 12px;
  }
}

@media (hover: hover) {
  .passages-toggle:not(.is-open):hover {
    background: linear-gradient(var(--surface-hi), var(--surface-raised));
  }
}
</style>
