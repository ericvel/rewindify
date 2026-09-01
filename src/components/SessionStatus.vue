<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const router = useRouter()
const session = useSessionStore()

/** Leaving the connect screen is the guard's job once the session is gone. */
async function disconnect() {
  await session.disconnect()
  await router.replace({ name: 'connect' })
}
</script>

<template>
  <div class="session">
    <span class="session__name">{{
      session.isConnected ? session.displayName : 'Not connected'
    }}</span>
    <button
      v-if="session.isConnected"
      type="button"
      class="session__disconnect"
      :title="`Disconnect ${session.session?.displayName}`"
      :aria-label="`Disconnect ${session.session?.displayName}`"
      @click="disconnect()"
    >
      <!-- Narrow headers get the glyph alone; the word arrives with the room
           for it at desktop width. -->
      <span class="session__icon" aria-hidden="true">⏏</span>
      <span class="session__label">Disconnect</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;

.session {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.session__name {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
  // A long Spotify display name is clipped rather than pushing the header
  // apart. `overflow: hidden` also lets the flex item shrink past its text, so
  // a narrow header squeezes this before it squeezes the search button.
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.session__disconnect {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  // Square enough to be a comfortable tap target where only the glyph shows.
  width: 36px;
  height: 36px;
  border: 1px solid #9a9a9a;
  background: #ffffff;

  @include screen-desktop {
    width: auto;
    height: 24px;
    padding: 0 10px;
  }

  @media (hover: hover) {
    &:hover {
      border-color: #1a1a1a;
    }
  }

  &:active {
    background: #f5f5f5;
  }
}

.session__icon {
  font-size: 13px;
  color: #1a1a1a;

  @include screen-desktop {
    display: none;
  }
}

.session__label {
  display: none;

  @include screen-desktop {
    display: block;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    color: #1a1a1a;
    text-transform: uppercase;
  }
}
</style>
