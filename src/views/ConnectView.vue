<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import AppBrand from '@/components/AppBrand.vue';
import { AUTH_FAILURE_MESSAGES } from '@/auth/failures';
import { resolveRedirectTarget } from '@/auth/redirect';
import { IS_CONFIGURED } from '@/spotify/config';
import { useSessionStore } from '@/stores/session';

const route = useRoute();
const session = useSessionStore();

/**
 * The one thing standing between this visitor and a session, if there is one.
 *
 * A build with no client id is the case the store cannot report: it sets
 * `unconfigured` inside `connect()`, and the button that would call it is
 * disabled on exactly that condition — so the message was unreachable and the
 * key read as dead. Stating it here needs no attempt.
 */
const notice = computed(() =>
  IS_CONFIGURED ? session.failureMessage : AUTH_FAILURE_MESSAGES.unconfigured,
);

/**
 * Hands the browser to Spotify, carrying the path the gate turned away so the
 * far side of the redirect knows where the visitor was going. Nothing after
 * this runs on this page: the answer arrives on `/callback`.
 */
async function connect() {
  await session.connect(resolveRedirectTarget(route.query.redirect));
}
</script>

<!--
  The gate. It says what the product does, what it needs, and offers the one
  action — in that order, because a visitor arriving on a shared loop link has
  never seen the app and a returning one only needs the key.

  The header carried a "Not connected" line until this pass. The router sends a
  connected visitor away from this route, so that line could only ever print
  those two words on the screen that already is the not-connected state — a
  third statement of a bit the heading and the button both make.
-->
<template>
  <div class="connect">
    <header class="connect__header">
      <AppBrand class="connect__brand" />
    </header>

    <main class="connect__body">
      <div class="connect__panel">
        <h1 class="connect__title">Step back and loop any passage</h1>
        <p class="connect__copy">
          Rewindify plays through your Spotify account. Connecting takes you there to sign in, then
          back here.
        </p>

        <!--
          Only ever the truth about what is in the way, so it sits above the
          button rather than replacing the invitation to try again. Inverted ink
          is the product's alert register; the accent is reserved for the loop.
        -->
        <p v-if="notice" id="connect-notice" class="connect__notice" role="alert">
          <AppIcon name="alert" :size="15" />
          <span>{{ notice }}</span>
        </p>

        <!--
          Printed above the key it gates, not under it. Premium is the one thing
          that can make this flow fail for a reason trying again cannot fix, so
          it is read before the press rather than found afterwards.
        -->
        <p id="connect-requirement" class="connect__requirement">Spotify Premium required</p>

        <button
          type="button"
          class="connect__action cap-surface"
          :aria-describedby="notice ? 'connect-notice connect-requirement' : 'connect-requirement'"
          :disabled="!IS_CONFIGURED"
          @click="connect()"
        >
          <AppIcon name="spotify" :size="18" />
          <span class="connect__action-label">Continue with Spotify</span>
        </button>
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
  padding: 0 16px;

  @include screen-desktop {
    height: 56px;
    box-shadow: inset 0 -1px 0 var(--surface-edge);
    padding: 0 20px;
  }
}

/* Type step only; `AppBrand` owns the mark, the weight and the tracking. */
.connect__brand {
  font-size: 17px;

  @include screen-desktop {
    font-size: 15px;
  }
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

.connect__notice {
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

/*
 * The legend and the key are one group: generous room above, tight below. The
 * hairline that used to separate this line from the button is gone with the
 * reordering — it was there to mark a footnote, and this is a label.
 */
.connect__requirement {
  @include legend(10px);
  margin: 28px 0 0;
}

.connect__action {
  @include cap;
  margin-top: 10px;
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

.connect__action-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.005em;
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
