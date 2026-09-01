<script setup lang="ts">
import TrackArtwork from './TrackArtwork.vue';
import type { Track } from '@/playback/types';

withDefaults(defineProps<{ track: Track; variant?: 'mobile' | 'desktop' }>(), {
  variant: 'mobile',
});
</script>

<template>
  <div class="now-playing" :class="`now-playing--${variant}`">
    <TrackArtwork
      :src="track.artworkUrl"
      :alt="`${track.album} cover art`"
      :size="variant === 'desktop' ? 84 : 60"
      labelled
    />
    <div class="now-playing__meta">
      <h1 class="now-playing__title">{{ track.title }}</h1>
      <p class="now-playing__artist">{{ track.artist }}</p>
      <p class="now-playing__album">{{ track.album }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.now-playing {
  display: flex;
  align-items: center;
  flex: none;
  min-width: 0;
}

.now-playing--mobile {
  gap: 14px;
}

.now-playing--desktop {
  gap: 18px;
}

.now-playing__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.now-playing__title,
.now-playing__artist,
.now-playing__album {
  margin: 0;
  overflow-wrap: anywhere;
}

/*
 * The title stays a step below the position readout. It is what you are
 * playing, not what you are working on, and the old 22px title next to a 20px
 * clock is what left the panel with no focal point.
 */
.now-playing__title {
  font-size: 19px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.012em;
  color: var(--ink);
  text-wrap: pretty;
}

.now-playing__artist {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  color: var(--ink-body);
}

.now-playing__album {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--ink-label);
}

.now-playing--desktop {
  .now-playing__meta {
    gap: 4px;
  }

  .now-playing__title {
    font-size: 24px;
  }

  .now-playing__artist {
    font-size: 15px;
  }

  .now-playing__album {
    font-size: 12px;
  }
}
</style>
