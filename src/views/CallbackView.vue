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
.callback {
  width: 100%;
  min-height: 100dvh;
  background: #ffffff;
  display: grid;
  place-items: center;
}

.callback__status {
  margin: 0;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
}
</style>
