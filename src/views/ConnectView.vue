<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import SessionStatus from '@/components/SessionStatus.vue';
import { resolveRedirectTarget } from '@/auth/redirect';
import { IS_CONFIGURED } from '@/spotify/config';
import { useSessionStore } from '@/stores/session';

const route = useRoute();
const session = useSessionStore();

/**
 * Hands the browser to Spotify, carrying the path the gate turned away so the
 * far side of the redirect knows where the visitor was going. Nothing after
 * this runs on this page: the answer arrives on `/callback`.
 */
async function connect() {
  await session.connect(resolveRedirectTarget(route.query.redirect));
}
</script>

<template>
  <div class="connect">
    <header class="connect__header">
      <span class="connect__brand">Rewindify</span>
      <span class="connect__spacer" />
      <SessionStatus />
    </header>

    <main class="connect__body">
      <div class="connect__panel">
        <h1 class="connect__title">Connect your Spotify account</h1>
        <p class="connect__copy">
          Rewindify plays from your library and loops the passage you are working on.
        </p>

        <p v-if="session.failureMessage" class="connect__failure" role="alert">
          <AppIcon name="alert" :size="15" />
          <span>{{ session.failureMessage }}</span>
        </p>

        <button
          type="button"
          class="connect__action cap-surface"
          aria-describedby="connect-requirement"
          :disabled="!IS_CONFIGURED"
          @click="connect()"
        >
          <span class="connect__mark" aria-hidden="true" />
          <span class="connect__action-label">Continue with Spotify</span>
        </button>

        <p id="connect-requirement" class="connect__requirement">Spotify Premium required</p>
      </div>
    </main>

    <footer class="connect__footer">
      <span>Eric Veliyulin · 2026</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

.connect {
  width: 100%;
  min-height: 100dvh;
  background: var(--surface-plate);
  color: var(--ink);
  display: flex;
  flex-direction: column;
}

.connect__header {
  height: 60px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 16px;

  @include screen-desktop {
    height: 56px;
    box-shadow: inset 0 -1px 0 var(--surface-edge);
    padding: 0 20px;
  }
}

.connect__brand {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.018em;

  @include screen-desktop {
    font-size: 15px;
  }
}

.connect__spacer {
  flex: 1;
}

/* Centred in whatever room the chrome leaves, at every width. */
.connect__body {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 24px 16px;
}

.connect__panel {
  width: 100%;
  max-width: 420px;
}

.connect__title {
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

.connect__copy {
  margin: 13px 0 0;
  font-size: 15px;
  line-height: 1.45;
  color: var(--ink-body);
}

/* Only ever the truth about the last attempt, so it sits above the button
   rather than replacing the invitation to try again. Inverted ink is the
   product's alert register; the accent is reserved for the loop. */
.connect__failure {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 22px 0 0;
  padding: 12px 13px;
  border-radius: 3px;
  background: var(--ink);
  color: var(--ink-inverse);
  font-size: 13px;
  line-height: 1.45;
}

.connect__action {
  @include cap;
  margin-top: 28px;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  // A build without a client id has nowhere to send anyone.
  &:disabled {
    background: var(--surface-well-deep);
    box-shadow: var(--shadow-well);
    color: var(--ink-label);
    cursor: not-allowed;
    transform: none;
  }
}

/*
 * Known debt, recorded in PRODUCT.md: Spotify's developer terms require the
 * official mark and a "content from Spotify" attribution. This is a neutral
 * stand-in, deliberately not a competing mark, and it is not a design decision
 * to defend — it is a slot waiting for the real asset.
 */
.connect__mark {
  width: 14px;
  height: 14px;
  flex: none;
  border-radius: 50%;
  background: currentcolor;
  opacity: 0.55;
}

.connect__action-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.005em;
}

.connect__requirement {
  @include legend(10px);
  box-shadow: inset 0 1px 0 var(--surface-edge);
  margin: 14px 0 0;
  padding-top: 13px;
}

.connect__footer {
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
