<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import DesktopSearchField from '@/components/DesktopSearchField.vue';
import MobileSearchOverlay from '@/components/MobileSearchOverlay.vue';
import SessionStatus from '@/components/SessionStatus.vue';
import { useIsDesktop } from '@/composables/useBreakpoint';
import { useLibraryStore } from '@/stores/library';
import type { Track } from '@/playback/types';

const router = useRouter();
const library = useLibraryStore();
const isDesktop = useIsDesktop();
const searchOpen = ref(false);

function open(track: Track) {
  searchOpen.value = false;
  void router.push({ name: 'track', params: { trackId: track.id } });
}
</script>

<!--
  The one screen the mock never needed. `/` means "the last thing you played",
  and a fixture always had one — a real account that Spotify remembers nothing
  for lands here instead, and needs somewhere to start rather than an empty
  player.
-->
<template>
  <div class="start">
    <header class="start__header">
      <span class="start__brand">Rewindify</span>
      <span class="start__spacer" />
      <SessionStatus />
      <button
        v-if="!isDesktop"
        type="button"
        class="start__search-button"
        @click="searchOpen = true"
      >
        <span aria-hidden="true">⌕</span>
        <span>Search</span>
      </button>
    </header>

    <main class="start__body">
      <div class="start__panel">
        <h1 class="start__title">Nothing played yet</h1>
        <p class="start__copy">
          Search your Spotify catalogue and pick a track. Rewindify remembers where you were and
          keeps the passage looping.
        </p>

        <DesktopSearchField v-if="isDesktop" class="start__search" @select="open" />

        <p v-if="library.error" class="start__note">{{ library.error }}</p>
        <p v-else class="start__note">
          Recently played appears here once Spotify has a play to show
        </p>
      </div>
    </main>

    <MobileSearchOverlay v-if="searchOpen" @close="searchOpen = false" @select="open" />

    <footer class="start__footer">
      <span>Eric Veliyulin · 2026</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;

.start {
  width: 100%;
  min-height: 100dvh;
  background: #ffffff;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    sans-serif;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.start__header {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;

  @include screen-desktop {
    height: 52px;
    border-bottom: 1px solid #9a9a9a;
    padding: 0 20px;
  }
}

.start__brand {
  font-size: 16px;
  font-weight: 600;

  @include screen-desktop {
    font-size: 15px;
  }
}

.start__spacer {
  flex: 1;
}

.start__search-button {
  height: 30px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #1a1a1a;
  background: #ffffff;
  padding: 0 10px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #1a1a1a;

  &:active {
    background: #f5f5f5;
  }
}

.start__body {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 24px 16px;
}

.start__panel {
  width: 100%;
  max-width: 460px;
}

.start__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;

  @include screen-desktop {
    font-size: 28px;
  }
}

.start__copy {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.4;
  color: #4a4a4a;
}

.start__search {
  margin-top: 26px;
}

.start__note {
  // The doubled hairline reads as a caption rule rather than a divider.
  border-top: 3px double #d4d4d4;
  margin: 26px 0 0;
  padding-top: 12px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
}

.start__footer {
  height: 36px;
  flex: none;
  border-top: 1px solid #9a9a9a;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #9a9a9a;

  @include screen-desktop {
    justify-content: flex-start;
  }
}
</style>
