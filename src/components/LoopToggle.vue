<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';

const props = withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), {
  variant: 'mobile',
});

const player = usePlayerStore();

/*
 * PRODUCT.md's vocabulary: the passage is what sits between A and B, and the
 * loop is what repeats it. "Segment" and "loop mode" were neither.
 */
const hint = () =>
  player.loopOn ? 'Drag A and B on the timeline' : 'Repeat a passage between A and B';
</script>

<template>
  <button
    type="button"
    class="loop"
    :class="[`loop--${props.variant}`, { 'is-on': player.loopOn }]"
    :aria-pressed="player.loopOn"
    @click="player.toggleLoop()"
  >
    <span class="loop__text">
      <span class="loop__label">Loop</span>
      <span v-if="props.variant === 'mobile'" class="loop__hint">{{ hint() }}</span>
    </span>
    <span class="loop__switch" aria-hidden="true">
      <span class="loop__knob" />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.loop {
  @include cap-light;
  display: flex;
  align-items: center;
  flex: none;
  text-align: left;
}

.loop--mobile {
  width: 100%;
  height: 62px;
  justify-content: space-between;
  padding: 0 12px 0 16px;
}

.loop--desktop {
  height: 52px;
  gap: 14px;
  padding: 0 12px 0 15px;
}

.loop__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.loop__label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--ink);
  transition: color var(--arm-duration) var(--ease-out);
}

.is-on .loop__label {
  color: var(--accent-text);
}

.loop__hint {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.15;
  color: var(--ink-label);
}

/* A slide switch: a well cut into the cap, with a raised knob riding in it. */
.loop__switch {
  position: relative;
  flex: none;
  width: 52px;
  height: 28px;
  border-radius: 14px;
  background: var(--surface-well-deep);
  box-shadow: var(--shadow-well);
  transition: background-color var(--arm-duration) var(--ease-out);
}

.is-on .loop__switch {
  background: var(--accent);
}

.loop__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(var(--cap-top), var(--cap-bottom));
  box-shadow: var(--shadow-cap);
  transition: left var(--arm-duration) var(--ease-out);
}

.is-on .loop__knob {
  left: 27px;
}

.loop--desktop {
  .loop__label {
    font-size: 12px;
  }

  .loop__switch {
    width: 46px;
    height: 25px;
    border-radius: 13px;
  }

  .loop__knob {
    top: 3px;
    width: 19px;
    height: 19px;
  }

  &.is-on .loop__knob {
    left: 24px;
  }
}
</style>
