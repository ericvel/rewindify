<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TrackRow from './TrackRow.vue'
import { useLibraryStore } from '@/stores/library'
import { usePlayerStore } from '@/stores/player'
import type { Track } from '@/playback/types'

const emit = defineEmits<{ select: [track: Track] }>()

const library = useLibraryStore()
const player = usePlayerStore()

const query = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(0)

const trimmed = computed(() => query.value.trim())
const results = computed(() => library.searchTracks(query.value))
const activeTrack = computed(() => results.value[activeIndex.value])
const activeOptionId = computed(() =>
  activeTrack.value ? `search-option-${activeTrack.value.id}` : undefined,
)
const resultsLabel = computed(() => {
  if (!trimmed.value) return `All ${library.tracks.length} tracks`
  return `${results.value.length} ${results.value.length === 1 ? 'match' : 'matches'}`
})

// A fresh query invalidates whatever the arrow keys had landed on.
watch(results, () => {
  activeIndex.value = 0
})

function open() {
  const el = popoverEl.value
  if (!el || el.matches(':popover-open')) return
  el.showPopover()
}

function close() {
  const el = popoverEl.value
  if (!el || !el.matches(':popover-open')) return
  el.hidePopover()
}

function pick(track: Track) {
  query.value = ''
  close()
  inputEl.value?.blur()
  emit('select', track)
}

function moveActive(delta: number) {
  if (!results.value.length) return
  const count = results.value.length
  activeIndex.value = (activeIndex.value + delta + count) % count
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    open()
    moveActive(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    open()
    moveActive(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const track = activeTrack.value ?? results.value[0]
    if (track) pick(track)
  } else if (event.key === 'Escape') {
    close()
    inputEl.value?.blur()
  }
}

function clearQuery() {
  query.value = ''
  inputEl.value?.focus()
}
</script>

<template>
  <div class="search">
    <div class="search__field">
      <span class="search__icon" aria-hidden="true">⌕</span>
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
        ✕
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
        <span>↵ to play</span>
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
.search {
  position: relative;
  width: 320px;
}

.search__field {
  // Anchor for the top-layer popover below.
  anchor-name: --rewindify-search;
  height: 32px;
  border: 1px solid #9a9a9a;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: #ffffff;
}

.search__icon {
  font-size: 12px;
  color: #767676;
}

.search__input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: none;
  color: #1a1a1a;
  font-size: 13px;
}

.search__clear {
  font-size: 13px;
  color: #767676;
  line-height: 1;
  padding: 2px;
}

.search__popover {
  position: fixed;
  position-anchor: --rewindify-search;
  position-area: block-end span-inline-end;
  position-try-fallbacks: flip-block;
  width: anchor-size(--rewindify-search width);
  margin: 0;
  margin-block-start: 1px;
  padding: 0;
  border: 1px solid #9a9a9a;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(26, 26, 26, 0.12);
  max-height: 340px;
  overflow-y: auto;
}

.search__popover-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 12px;
  border-bottom: 1px solid #d4d4d4;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  color: #767676;
  text-transform: uppercase;
}

.search__empty {
  margin: 0;
  padding: 14px 12px;
  font-size: 12px;
  color: #767676;
}
</style>
