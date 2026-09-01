<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

/**
 * A session can now end without anyone asking — a refresh token Spotify no
 * longer honours, or a revalidation that finds the account gone. The gate only
 * runs on navigation, so the screen you are already on has to be sent back
 * itself, rather than sitting there failing every request it makes.
 */
watch(
  () => session.isConnected,
  (isConnected) => {
    if (isConnected || route.name === 'connect' || route.name === 'callback') return;
    void router.replace({ name: 'connect' });
  },
);
</script>

<template>
  <RouterView />
</template>

<style scoped lang="scss"></style>
