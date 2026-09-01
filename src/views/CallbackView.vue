<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { resolveRedirectTarget } from '@/auth/redirect';
import { useSessionStore } from '@/stores/session';

const router = useRouter();
const session = useSessionStore();

/**
 * The far side of the redirect: exchange the code, then leave. Nothing here is
 * worth designing beyond the moment it takes, and `replace` keeps a URL holding
 * a spent authorisation code out of the history.
 *
 * The query is read from `window.location` rather than the route, because the
 * app has to be certain it is reading what Spotify actually sent.
 */
onMounted(async () => {
  const target = await session.completeRedirect(new URLSearchParams(window.location.search));
  await router.replace(target === null ? { name: 'connect' } : resolveRedirectTarget(target));
});
</script>

<template>
  <div class="callback">
    <p class="callback__status">Finishing sign-in…</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

.callback {
  width: 100%;
  min-height: 100dvh;
  background: var(--surface-plate);
  display: grid;
  place-items: center;
}

.callback__status {
  @include legend(11px);
  margin: 0;
}
</style>
