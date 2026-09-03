<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
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

/** The desktop field's wording; one search, one vocabulary. */
const resultsLabel = computed(() => {
  if (library.error) return library.error;
  if (!trimmed.value) return 'Recently played';
  if (library.isSearching) return 'Searching…';
  const count = matches.value.length;
  // Nothing found prints once, in the sentence that names the query.
  if (count === 0) return null;
  return `${count} ${count === 1 ? 'match' : 'matches'}`;
});

/*
 * Only once there is an answer. The overlay printed `No tracks match “b”.`
 * directly under a label that still said `Searching…`, because the store holds
 * `isSearching` through the debounce and the request and the first search of a
 * session has no rows behind it.
 */
const emptyLabel = computed(() => {
  if (library.isSearching || rows.value.length > 0) return null;
  return trimmed.value ? `No tracks match “${trimmed.value}”.` : 'Nothing played yet.';
});

/*
 * The overlay says `role="dialog"`, so it has to behave like one: Escape closes
 * it, and the focus goes back to the control that opened it rather than being
 * dropped on the body when this unmounts. Without the restore, a keyboard user
 * who closed search landed nowhere and had to tab in from the top of the plate.
 */
const opener = ref<HTMLElement | null>(null);

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  emit('close');
}

onMounted(() => {
  opener.value = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  inputEl.value?.focus();
});

onUnmounted(() => opener.value?.focus());
</script>

<template>
  <div
    class="search-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Search"
    @keydown="onKeydown"
  >
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

    <p v-if="resultsLabel" class="search-overlay__label">{{ resultsLabel }}</p>

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
      <p v-if="emptyLabel" class="search-overlay__empty">{{ emptyLabel }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

.search-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: var(--surface-plate);
  display: flex;
  flex-direction: column;
  padding: 0 16px 20px;

  /* Lands on the plate's own gutter, so opening search does not shift the page. */
  @include screen-wide {
    padding: 0 24px 24px;
  }
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
