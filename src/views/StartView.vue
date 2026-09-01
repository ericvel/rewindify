<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
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
        aria-label="Search"
        @click="searchOpen = true"
      >
        <AppIcon name="search" :size="17" />
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
@use '@/styles/surfaces' as *;

.start {
  width: 100%;
  min-height: 100dvh;
  background: var(--surface-plate);
  color: var(--ink);
  display: flex;
  flex-direction: column;
}

.start__header {
  height: 60px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;

  @include screen-desktop {
    height: 56px;
    box-shadow: inset 0 -1px 0 var(--surface-edge);
    padding: 0 20px;
  }
}

.start__brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.018em;

  @include screen-desktop {
    font-size: 15px;
  }
}

.start__spacer {
  flex: 1;
}

.start__search-button {
  @include cap-light;
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  color: var(--ink-body);
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
  font-size: 25px;
  font-weight: 700;
  line-height: 1.14;
  letter-spacing: -0.022em;
  text-wrap: pretty;

  @include screen-desktop {
    font-size: 29px;
  }
}

.start__copy {
  margin: 13px 0 0;
  font-size: 15px;
  line-height: 1.45;
  color: var(--ink-body);
}

.start__search {
  margin-top: 26px;
}

.start__note {
  @include legend(10px);
  box-shadow: inset 0 1px 0 var(--surface-edge);
  margin: 26px 0 0;
  padding-top: 13px;
  line-height: 1.4;
}

.start__footer {
  height: 40px;
  flex: none;
  box-shadow: inset 0 1px 0 var(--surface-edge);
  background: var(--surface-well);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-label);

  @include screen-desktop {
    justify-content: flex-start;
  }
}
</style>
