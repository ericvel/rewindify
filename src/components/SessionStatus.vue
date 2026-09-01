<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { useSessionStore } from '@/stores/session';

const router = useRouter();
const session = useSessionStore();

/** Leaving the connect screen is the guard's job once the session is gone. */
async function disconnect() {
  await session.disconnect();
  await router.replace({ name: 'connect' });
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
      <!-- Narrow headers get the mark alone; the word arrives with the room
           for it at desktop width. -->
      <AppIcon name="eject" :size="16" />
      <span class="session__label">Disconnect</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

.session {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.session__name {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--ink-label);
  // A long Spotify display name is clipped rather than pushing the header
  // apart. `overflow: hidden` also lets the flex item shrink past its text, so
  // a narrow header squeezes this before it squeezes the search button.
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.session__disconnect {
  @include cap-light;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  // Square enough to be a comfortable tap target where only the mark shows.
  width: 38px;
  height: 38px;
  color: var(--ink-body);

  @include screen-desktop {
    width: auto;
    height: 28px;
    padding: 0 10px;
  }
}

.session__label {
  display: none;

  @include screen-desktop {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink);
  }
}

@media (hover: hover) {
  .session__disconnect:hover {
    color: var(--ink);
    background: linear-gradient(var(--surface-hi), var(--surface-raised));
  }
}
</style>
