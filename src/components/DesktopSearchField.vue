<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import TrackRow from './TrackRow.vue';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import type { Track } from '@/playback/types';

const emit = defineEmits<{ select: [track: Track] }>();

const library = useLibraryStore();
const player = usePlayerStore();

const query = ref('');
const inputEl = ref<HTMLInputElement | null>(null);
const popoverEl = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const activeIndex = ref(0);

const trimmed = computed(() => query.value.trim());

/** With no query the popover doubles as the recently-played list. */
const results = computed(() =>
  trimmed.value ? library.searchResults : library.recentTracks.map((entry) => entry.track),
);
const activeTrack = computed(() => results.value[activeIndex.value]);
const activeOptionId = computed(() =>
  activeTrack.value ? `search-option-${activeTrack.value.id}` : undefined,
);
const resultsLabel = computed(() => {
  if (library.error) return library.error;
  if (!trimmed.value) return 'Recently played';
  if (library.isSearching) return 'Searching…';
  const count = results.value.length;
  return `${count} ${count === 1 ? 'match' : 'matches'}`;
});

// Results now arrive after the keystroke that asked for them, so the store is
// told about the query and the rows follow when Spotify answers.
watch(query, (next) => library.search(next));

// A fresh query invalidates whatever the arrow keys had landed on.
watch(results, () => {
  activeIndex.value = 0;
});

function open() {
  const el = popoverEl.value;
  if (!el || el.matches(':popover-open')) return;
  el.showPopover();
}

function close() {
  const el = popoverEl.value;
  if (!el || !el.matches(':popover-open')) return;
  el.hidePopover();
}

function pick(track: Track) {
  query.value = '';
  close();
  inputEl.value?.blur();
  emit('select', track);
}

function moveActive(delta: number) {
  if (!results.value.length) return;
  const count = results.value.length;
  activeIndex.value = (activeIndex.value + delta + count) % count;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    open();
    moveActive(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    open();
    moveActive(-1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const track = activeTrack.value ?? results.value[0];
    if (track) pick(track);
  } else if (event.key === 'Escape') {
    close();
    inputEl.value?.blur();
  }
}

function clearQuery() {
  query.value = '';
  inputEl.value?.focus();
}
</script>

<template>
  <div class="search">
    <div class="search__field">
      <AppIcon class="search__icon" name="search" :size="16" />
      <input
        ref="inputEl"
        v-model="query"
        class="search__input"
        type="text"
        role="combobox"
        placeholder="Search your library"
        aria-label="Search your library"
        aria-controls="search-results"
        :aria-expanded="isOpen"
        :aria-activedescendant="isOpen ? activeOptionId : undefined"
        autocomplete="off"
        @focus="open"
        @click="open"
        @input="open"
        @keydown="onKeydown"
      />
      <button
        v-if="trimmed"
        type="button"
        class="search__clear"
        aria-label="Clear search"
        @click="clearQuery"
      >
        <AppIcon name="close" :size="14" />
      </button>
    </div>

    <div
      id="search-results"
      ref="popoverEl"
      class="search__popover"
      popover="auto"
      role="listbox"
      aria-label="Search results"
      @toggle="isOpen = ($event as ToggleEvent).newState === 'open'"
    >
      <div class="search__popover-header">
        <span>{{ resultsLabel }}</span>
        <span class="search__hint">Enter to play</span>
      </div>
      <TrackRow
        v-for="(track, index) in results"
        :id="`search-option-${track.id}`"
        :key="track.id"
        role="option"
        :aria-selected="index === activeIndex"
        :track="track"
        :active="track.id === player.currentTrack?.id"
        :highlighted="index === activeIndex"
        size="sm"
        @select="pick(track)"
      />
      <p v-if="!results.length" class="search__empty">No tracks match “{{ trimmed }}”.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.search {
  position: relative;
  width: 320px;
}

.search__field {
  @include well;
  // Anchor for the top-layer popover below.
  anchor-name: --rewindify-search;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
}

.search__icon {
  color: var(--ink-label);
}

.search__input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: none;
  color: var(--ink);
  font-size: 13px;

  &::placeholder {
    color: var(--ink-label);
  }
}

.search__clear {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 2px;
  color: var(--ink-label);

  @media (hover: hover) {
    &:hover {
      color: var(--ink);
      background: var(--surface-well-deep);
    }
  }
}

/* The popover is a plate lifted off the surface, not an outlined box. */
.search__popover {
  position: fixed;
  position-anchor: --rewindify-search;
  position-area: block-end span-inline-end;
  position-try-fallbacks: flip-block;
  width: anchor-size(--rewindify-search width);
  margin: 0;
  margin-block-start: 5px;
  padding: 4px;
  border: 0;
  border-radius: 4px;
  background: var(--surface-plate);
  box-shadow: var(--shadow-popover);
  max-height: 340px;
  overflow-y: auto;
}

.search__popover-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  padding: 7px 10px 9px;
  margin-bottom: 2px;
  box-shadow: inset 0 -1px 0 var(--surface-rule);
  @include legend(10px);
}

.search__hint {
  flex: none;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: none;
}

.search__empty {
  margin: 0;
  padding: 14px 10px;
  font-size: 12px;
  color: var(--ink-body);
}
</style>
