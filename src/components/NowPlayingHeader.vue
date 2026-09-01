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
      :size="variant === 'desktop' ? 88 : 64"
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
}

.now-playing--mobile {
  gap: 16px;
}

.now-playing--desktop {
  gap: 20px;
}

.now-playing__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.now-playing__title,
.now-playing__artist,
.now-playing__album {
  margin: 0;
}

.now-playing__title {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.15;
  text-wrap: pretty;
}

.now-playing__artist {
  font-size: 14px;
  color: #4a4a4a;
  line-height: 1.2;
}

.now-playing__album {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #767676;
  text-transform: uppercase;
  padding-top: 2px;
}

.now-playing--desktop {
  .now-playing__meta {
    gap: 6px;
  }

  .now-playing__title {
    font-size: 30px;
    line-height: 1.1;
  }

  .now-playing__artist {
    font-size: 15px;
  }

  .now-playing__album {
    padding-top: 0;
  }
}
</style>
