<script setup lang="ts">
import { computed } from 'vue';
import TrackArtwork from './TrackArtwork.vue';
import { formatAgo, formatTime } from '@/playback/time';
import type { Track } from '@/playback/types';

const props = withDefaults(
  defineProps<{
    track: Track;
    /** Highlights the row as the loaded track. */
    active?: boolean;
    /** Omit to hide the relative-time column. */
    playedAt?: number;
    /** Keyboard focus within a listbox, as opposed to being the loaded track. */
    highlighted?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { active: false, playedAt: undefined, highlighted: false, size: 'md' },
);

defineEmits<{ select: [] }>();

const artSize = computed(() => ({ sm: 36, md: 44, lg: 48 })[props.size]);
const durationLabel = computed(() => formatTime(props.track.duration));
const agoLabel = computed(() => (props.playedAt === undefined ? null : formatAgo(props.playedAt)));
</script>

<template>
  <button
    type="button"
    class="track-row"
    :class="[`track-row--${size}`, { 'is-active': active, 'is-highlighted': highlighted }]"
    :aria-current="active ? 'true' : undefined"
    @click="$emit('select')"
  >
    <TrackArtwork :src="track.artworkUrl" :alt="`${track.album} cover art`" :size="artSize" />
    <span class="track-row__meta">
      <span class="track-row__title">{{ track.title }}</span>
      <span class="track-row__artist">{{ track.artist }}</span>
    </span>
    <span class="track-row__aside">
      <span class="track-row__duration">{{ durationLabel }}</span>
      <span v-if="agoLabel" class="track-row__ago">{{ agoLabel }}</span>
    </span>
  </button>
</template>

<style scoped lang="scss">
.track-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #d4d4d4;
  background: #ffffff;

  &.is-active {
    background: #eaeaea;
  }

  &.is-highlighted {
    background: #f5f5f5;
  }

  &.is-active.is-highlighted {
    background: #e0e0e0;
  }
}

.track-row__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.track-row__title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.track-row__artist {
  font-size: 12px;
  color: #767676;
}

.track-row__aside {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.track-row__duration {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #767676;
}

.track-row__ago {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: #9a9a9a;
}

.track-row--sm {
  gap: 10px;
  padding: 9px 12px;
  border-bottom-color: #eaeaea;

  .track-row__meta {
    gap: 2px;
  }

  .track-row__title {
    font-size: 13px;
  }

  .track-row__artist {
    font-size: 11px;
  }
}

.track-row--lg {
  padding: 10px 8px;

  .track-row__title {
    font-size: 15px;
  }
}

@media (hover: hover) {
  .track-row:hover {
    background: #f5f5f5;
  }
}
</style>
