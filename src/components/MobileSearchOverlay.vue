<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
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
        <span class="search-overlay__icon" aria-hidden="true">⌕</span>
        <input
          ref="inputEl"
          v-model="query"
          class="search-overlay__input"
          type="search"
          placeholder="Search Spotify"
          aria-label="Search Spotify"
        />
      </div>
      <button type="button" class="search-overlay__close" @click="emit('close')">Close</button>
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
.search-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 0 16px 20px;
}

.search-overlay__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
}

.search-overlay__field {
  flex: 1;
  height: 40px;
  border: 1px solid #9a9a9a;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.search-overlay__icon {
  font-size: 13px;
  color: #767676;
}

.search-overlay__input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: none;
  color: #1a1a1a;
  font-size: 15px;
}

.search-overlay__close {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #1a1a1a;
  text-transform: uppercase;
  padding: 0 4px;
}

.search-overlay__label {
  margin: 0;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: #767676;
  text-transform: uppercase;
  padding: 6px 2px 10px;
}

.search-overlay__results {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-top: 1px solid #d4d4d4;
}

.search-overlay__empty {
  margin: 0;
  padding: 14px 8px;
  font-size: 13px;
  color: #767676;
}
</style>
