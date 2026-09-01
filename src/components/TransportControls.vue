<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();
</script>

<template>
  <div class="transport" :class="`transport--${variant}`">
    <button
      type="button"
      class="transport__button transport__button--skip"
      :aria-label="`Rewind ${player.skipSeconds} seconds`"
      @click="player.rewind()"
    >
      <span class="transport__glyph" aria-hidden="true">↺</span>
      <span class="transport__skip-label">{{ player.skipLabel }}</span>
    </button>

    <button
      type="button"
      class="transport__button transport__button--play"
      :aria-label="player.isPlaying ? 'Pause' : 'Play'"
      @click="player.togglePlay()"
    >
      <span class="transport__glyph transport__glyph--play" aria-hidden="true">
        {{ player.playGlyph }}
      </span>
    </button>

    <button
      type="button"
      class="transport__button transport__button--skip"
      :aria-label="`Fast forward ${player.skipSeconds} seconds`"
      @click="player.forward()"
    >
      <span class="transport__glyph" aria-hidden="true">↻</span>
      <span class="transport__skip-label">{{ player.skipLabel }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.transport {
  display: flex;
  align-items: center;
  flex: none;
}

.transport--mobile {
  justify-content: space-between;
  border: 1px solid #9a9a9a;
  background: #ffffff;
  padding: 16px;
}

.transport--desktop {
  gap: 16px;
}

.transport__button {
  border-radius: 50%;
  border: 1px solid #1a1a1a;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;

  &:active {
    background: #eaeaea;
  }
}

.transport__button--skip {
  width: 72px;
  height: 72px;
}

.transport__button--play {
  width: 96px;
  height: 96px;
  border-width: 2px;
}

.transport__glyph {
  font-size: 20px;
  line-height: 1;
  color: #1a1a1a;
}

.transport__glyph--play {
  font-size: 28px;
}

.transport__skip-label {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #767676;
}

.transport--desktop {
  .transport__button--skip {
    width: 56px;
    height: 56px;
  }

  .transport__button--play {
    width: 72px;
    height: 72px;
  }

  .transport__glyph {
    font-size: 16px;
  }

  .transport__glyph--play {
    font-size: 22px;
  }

  .transport__skip-label {
    font-size: 10px;
  }
}

@media (hover: hover) {
  .transport--desktop .transport__button:hover {
    background: #f5f5f5;
  }
}
</style>
