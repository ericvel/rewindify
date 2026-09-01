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

const artSize = computed(() => ({ sm: 34, md: 40, lg: 46 })[props.size]);
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
    <span class="track-row__body">
      <!-- A printed index: the leader carries the eye from the title to its
           duration, which is what a list of times is for. -->
      <span class="track-row__line">
        <span class="track-row__title">{{ track.title }}</span>
        <span class="track-row__leader" aria-hidden="true" />
        <span class="track-row__duration">{{ durationLabel }}</span>
      </span>
      <span class="track-row__line">
        <span class="track-row__artist">{{ track.artist }}</span>
        <span v-if="agoLabel" class="track-row__ago">{{ agoLabel }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.track-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 14px;
  text-align: left;
  background: transparent;
  border-radius: 3px;
  position: relative;

  /* Hairline rules instead of outlined cards: this is an index, not a stack. */
  & + & {
    box-shadow: inset 0 1px 0 var(--surface-rule);
  }

  &.is-active {
    @include well;
  }

  &.is-highlighted:not(.is-active) {
    background: var(--surface-raised);
  }
}

.track-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.track-row__line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.track-row__title {
  flex: none;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.006em;
  color: var(--ink);
}

.track-row__leader {
  flex: 1;
  min-width: 10px;
  border-bottom: 1px dotted var(--surface-edge);
  transform: translateY(-3px);
}

.track-row__duration {
  @include figures;
  flex: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-label);
}

.track-row__artist {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--ink-body);
}

.track-row__ago {
  @include figures;
  flex: none;
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-label);
}

.track-row--sm {
  gap: 9px;
  padding: 8px 12px;

  .track-row__title {
    font-size: 13px;
  }

  .track-row__artist,
  .track-row__duration {
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
  .track-row:not(.is-active):hover {
    background: var(--surface-raised);
  }
}
</style>
