<script setup lang="ts">
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
