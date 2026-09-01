<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();
</script>

<template>
  <button
    type="button"
    class="loop-toggle"
    :class="[`loop-toggle--${variant}`, { 'is-on': player.loopOn }]"
    :aria-pressed="player.loopOn"
    @click="player.toggleLoop()"
  >
    <span class="loop-toggle__text">
      <span class="loop-toggle__label">{{ variant === 'desktop' ? 'LOOP' : 'LOOP MODE' }}</span>
      <span v-if="variant === 'mobile'" class="loop-toggle__hint">
        {{ player.loopOn ? 'Drag A and B on the timeline' : 'Tap to repeat a segment' }}
      </span>
    </span>
    <span class="loop-toggle__switch" aria-hidden="true">
      <span class="loop-toggle__knob" />
    </span>
  </button>
</template>

<style scoped lang="scss">
.loop-toggle {
  display: flex;
  align-items: center;
  border: 1px solid #9a9a9a;
  background: #ffffff;
  flex: none;

  &.is-on {
    background: #eaeaea;
  }
}

.loop-toggle--mobile {
  width: 100%;
  height: 60px;
  justify-content: space-between;
  padding: 0 16px 0 18px;
}

.loop-toggle--desktop {
  height: 48px;
  gap: 14px;
  padding: 0 14px;
}

.loop-toggle__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.loop-toggle__label {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: #1a1a1a;
}

.loop-toggle__hint {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: #767676;
}

.loop-toggle__switch {
  position: relative;
  flex: none;
  width: 58px;
  height: 32px;
  border: 1px solid #1a1a1a;
  background: #ffffff;
}

.loop-toggle__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border: 1px solid #1a1a1a;
  background: #ffffff;
}

.is-on .loop-toggle__knob {
  left: 31px;
  background: #1a1a1a;
}

.loop-toggle--desktop {
  .loop-toggle__label {
    font-size: 11px;
  }

  .loop-toggle__switch {
    width: 52px;
    height: 26px;
  }

  .loop-toggle__knob {
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
  }

  &.is-on .loop-toggle__knob {
    left: 28px;
  }
}
</style>
