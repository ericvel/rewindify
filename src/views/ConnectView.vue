<script setup lang="ts">
import { useRoute } from 'vue-router'
import SessionStatus from '@/components/SessionStatus.vue'
import { resolveRedirectTarget } from '@/auth/redirect'
import { IS_CONFIGURED } from '@/spotify/config'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const session = useSessionStore()

/**
 * Hands the browser to Spotify, carrying the path the gate turned away so the
 * far side of the redirect knows where the visitor was going. Nothing after
 * this runs on this page: the answer arrives on `/callback`.
 */
async function connect() {
  await session.connect(resolveRedirectTarget(route.query.redirect))
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
          {{ session.failureMessage }}
        </p>

        <button
          type="button"
          class="connect__action"
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

.connect {
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

.connect__header {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 16px;

  @include screen-desktop {
    height: 52px;
    border-bottom: 1px solid #9a9a9a;
    padding: 0 20px;
  }
}

.connect__brand {
  font-size: 16px;
  font-weight: 600;

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
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.01em;

  @include screen-desktop {
    font-size: 28px;
  }
}

.connect__copy {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.4;
  color: #4a4a4a;
}

/* Only ever the truth about the last attempt, so it sits above the button
   rather than replacing the invitation to try again. */
.connect__failure {
  margin: 24px 0 0;
  border-left: 3px solid #1a1a1a;
  padding: 2px 0 2px 12px;
  font-size: 13px;
  line-height: 1.45;
  color: #1a1a1a;
}

.connect__action {
  margin-top: 30px;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid #1a1a1a;
  background: #1a1a1a;

  &:active {
    background: #4a4a4a;
    border-color: #4a4a4a;
  }

  // A build without a client id has nowhere to send anyone.
  &:disabled {
    background: #9a9a9a;
    border-color: #9a9a9a;
  }
}

/* Stands in for the Spotify mark, in the same register as the app's other
   placeholder art. */
.connect__mark {
  width: 14px;
  height: 14px;
  flex: none;
  border-radius: 50%;
  background: #ffffff;
}

.connect__action-label {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.connect__requirement {
  // The doubled hairline reads as a caption rule rather than a divider.
  border-top: 3px double #d4d4d4;
  margin: 10px 0 0;
  padding-top: 12px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
}

.connect__footer {
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
