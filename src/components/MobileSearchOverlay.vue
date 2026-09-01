<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import TrackRow from './TrackRow.vue';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import type { Track } from '@/playback/types';

const emit = defineEmits<{ close: []; select: [track: Track] }>();

const library = useLibraryStore();
const player = usePlayerStore();

const query = ref('');
const inputEl = ref<HTMLInputElement | null>(null);

const trimmed = computed(() => query.value.trim());
const matches = computed(() => library.searchResults);

// Results now arrive after the keystroke that asked for them.
watch(query, (next) => library.search(next));

/** With no query the overlay doubles as the recently-played list. */
const rows = computed(() =>
  trimmed.value
    ? matches.value.map((track) => ({ track, playedAt: undefined }))
    : library.recentTracks.map((entry) => ({ track: entry.track, playedAt: entry.playedAt })),
);

const resultsLabel = computed(() => {
  if (library.error) return library.error;
  if (!trimmed.value) return 'Recently played';
  if (library.isSearching) return 'Searching…';
  const count = matches.value.length;
  return `${count} ${count === 1 ? 'track' : 'tracks'}`;
});

onMounted(() => inputEl.value?.focus());
</script>

<template>
  <div class="search-overlay" role="dialog" aria-label="Search">
    <div class="search-overlay__bar">
      <div class="search-overlay__field">
        <AppIcon class="search-overlay__icon" name="search" :size="17" />
        <input
          ref="inputEl"
          v-model="query"
          class="search-overlay__input"
          type="search"
          placeholder="Search Spotify"
          aria-label="Search Spotify"
        />
      </div>
      <button
        type="button"
        class="search-overlay__close"
        aria-label="Close search"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="17" />
      </button>
    </div>

    <p class="search-overlay__label">{{ resultsLabel }}</p>

    <div class="search-overlay__results">
      <TrackRow
        v-for="row in rows"
        :key="row.track.id"
        :track="row.track"
        :played-at="row.playedAt"
        :active="row.track.id === player.currentTrack?.id"
        size="lg"
        @select="emit('select', row.track)"
      />
      <p v-if="trimmed && !matches.length" class="search-overlay__empty">
        No tracks match “{{ trimmed }}”.
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.search-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: var(--surface-plate);
  display: flex;
  flex-direction: column;
  padding: 0 16px 20px;
}

.search-overlay__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 60px;
}

.search-overlay__field {
  @include well;
  flex: 1;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
}

.search-overlay__icon {
  color: var(--ink-label);
}

.search-overlay__input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: none;
  color: var(--ink);
  font-size: 15px;

  &::placeholder {
    color: var(--ink-label);
  }

  /* The type=search clear affordance belongs to no design system. */
  &::-webkit-search-cancel-button {
    appearance: none;
  }
}

.search-overlay__close {
  @include cap-light;
  flex: none;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  color: var(--ink-body);
}

.search-overlay__label {
  @include legend(10px);
  margin: 0;
  padding: 8px 2px 10px;
}

.search-overlay__results {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-top: 2px;
  box-shadow: inset 0 1px 0 var(--surface-rule);
}

.search-overlay__empty {
  margin: 0;
  padding: 16px 8px;
  font-size: 13px;
  color: var(--ink-body);
}
</style>
