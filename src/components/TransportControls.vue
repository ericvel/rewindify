<script setup lang="ts">
import AppIcon from './AppIcon.vue';
import { usePlayerStore } from '@/stores/player';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();
</script>

<template>
  <div class="transport" :class="`transport--${variant}`">
    <!--
      The three keys are identical in size and material, the way a transport row
      on real gear is. Stepping back is the most frequent action in a practice
      session, so it may not be the smallest key on the panel — which is what it
      was when play was 96px and the steps were 72px.
    -->
    <button
      type="button"
      class="transport__key cap-surface"
      :aria-label="`Rewind ${player.skipSeconds} seconds`"
      @click="player.rewind()"
    >
      <AppIcon name="step-back" :size="variant === 'desktop' ? 20 : 24" />
      <span class="transport__step">{{ player.skipLabel }}</span>
    </button>

    <button
      type="button"
      class="transport__key cap-surface"
      :aria-label="player.isPlaying ? 'Pause' : 'Play'"
      @click="player.togglePlay()"
    >
      <AppIcon
        :name="player.isPlaying ? 'pause' : 'play'"
        :size="variant === 'desktop' ? 24 : 28"
      />
    </button>

    <button
      type="button"
      class="transport__key cap-surface"
      :aria-label="`Fast forward ${player.skipSeconds} seconds`"
      @click="player.forward()"
    >
      <AppIcon name="step-forward" :size="variant === 'desktop' ? 20 : 24" />
      <span class="transport__step">{{ player.skipLabel }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.transport {
  display: flex;
  align-items: center;
  flex: none;
}

.transport--mobile {
  justify-content: center;
  gap: 22px;
}

.transport--desktop {
  gap: 16px;
}

.transport__key {
  @include cap(50%);
  width: 76px;
  height: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.transport__step {
  @include figures;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.01em;
  color: rgba(242, 239, 232, 0.62);
}

.transport--desktop {
  .transport__key {
    width: 60px;
    height: 60px;
  }

  .transport__step {
    font-size: 10px;
  }
}

@media (hover: hover) {
  .transport__key:hover {
    background: linear-gradient(#474741, var(--cap-top));
  }
}
</style>
