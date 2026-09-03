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
  /*
   * Nothing found prints once, and it prints the sentence. `0 matches` above
   * `No tracks match “zzzz”.` was the same fact twice, and the sentence is the
   * half that carries the query — which is what a user who mistyped needs.
   */
  if (count === 0) return null;
  return `${count} ${count === 1 ? 'match' : 'matches'}`;
});

/*
 * Only once there is an answer. `!results.length` alone printed `No tracks
 * match “b”.` under a header that still said `Searching…` — the store keeps
 * `isSearching` up through the 250ms debounce and the request behind it, and
 * on the first search of a session there are no stale rows to sit under. It
 * also fired with no query at all on an account Spotify has no history for,
 * which printed the sentence with an empty pair of quotes in it.
 */
const emptyLabel = computed(() => {
  if (library.isSearching || results.value.length > 0) return null;
  return trimmed.value ? `No tracks match “${trimmed.value}”.` : 'Nothing played yet.';
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
        placeholder="Search Spotify"
        aria-label="Search Spotify"
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
      <div v-if="resultsLabel" class="search__popover-header">
        <span>{{ resultsLabel }}</span>
        <!-- Only while there is a row for that key to land on. -->
        <span v-if="results.length > 0" class="search__hint">Enter to play</span>
      </div>
      <!-- `tabindex="-1"`: this is an `aria-activedescendant` combobox, so the
           field keeps DOM focus and the arrows move the active row. Left
           tabbable, the two models contradicted each other — Tab walked
           twenty-seven option buttons while the field still claimed one of
           them as its active descendant. -->
      <TrackRow
        v-for="(track, index) in results"
        :id="`search-option-${track.id}`"
        :key="track.id"
        role="option"
        tabindex="-1"
        :aria-selected="index === activeIndex"
        :track="track"
        :active="track.id === player.currentTrack?.id"
        :highlighted="index === activeIndex"
        size="sm"
        @select="pick(track)"
      />
      <p v-if="emptyLabel" class="search__empty">{{ emptyLabel }}</p>
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
  /*
   * Two cap presses. The plate has further to travel than a key does, and it
   * still may not read as a wait to someone holding an instrument. Derived from
   * the press token rather than declared, so `prefers-reduced-motion` zeroing
   * `--press-duration` at `:root` zeroes this with it.
   */
  --lift-duration: calc(var(--press-duration) * 2);

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
  max-height: 340px;
  overflow-y: auto;

  /*
   * Closed: tucked up under the field, clipped to its own top edge, flush.
   * Opening draws the plate down out of the slot the field is cut into —
   * the clip reveals, the plate drops, the shadow lifts. Three properties
   * saying one thing, and deliberately no opacity: the fade belongs to the
   * loop's sweep, and this world's `--ease-out` is exponential, not a fade.
   *
   * The reveal runs from the anchored edge downward, which is the placement
   * `position-area` gives it in the desktop header. `flip-block` would put the
   * plate above the field and the gesture would then read from the wrong edge;
   * there is no CSS hook for the chosen fallback, and at 340px under a header
   * at the top of the viewport the fallback does not fire.
   */
  translate: 0 -6px;
  clip-path: inset(0 -44px 100% -44px);
  box-shadow: var(--shadow-popover-flush);
  pointer-events: none;

  /* Exit is the same gesture reversed, at press speed: dropped back in. */
  transition:
    translate var(--press-duration) var(--ease-out),
    clip-path var(--press-duration) var(--ease-out),
    box-shadow var(--press-duration) var(--ease-out),
    display var(--press-duration) allow-discrete,
    overlay var(--press-duration) allow-discrete;

  &:popover-open {
    translate: 0 0;
    /* Negative insets clear the lifted shadow on three sides; the top stays at
       the box edge so the spill never paints back over the field. */
    clip-path: inset(0 -44px -44px -44px);
    box-shadow: var(--shadow-popover);
    pointer-events: auto;

    transition:
      translate var(--lift-duration) var(--ease-out),
      clip-path var(--lift-duration) var(--ease-out),
      box-shadow var(--lift-duration) var(--ease-out),
      display var(--lift-duration) allow-discrete,
      overlay var(--lift-duration) allow-discrete;

    @starting-style {
      translate: 0 -6px;
      clip-path: inset(0 -44px 100% -44px);
      box-shadow: var(--shadow-popover-flush);
    }
  }
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
