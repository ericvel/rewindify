<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import AppBrand from '@/components/AppBrand.vue';
import LoopDemo from '@/components/LoopDemo.vue';
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
async function signIn() {
  await session.connect(resolveRedirectTarget(route.query.redirect));
}
</script>

<!--
  The gate. It shows what the product does, explains why Spotify is involved,
  and offers the one action — in that order, because a visitor arriving on a
  shared loop link has never seen the app and a returning one only needs the key.

  The showing is the working panel itself, cut into the plate before the
  decision group: beside it on desktop, above it on a narrow plate. Every other
  screen in this product is the instrument; this one used to be a paragraph
  about it, and a sentence about looping a passage is weaker than a passage
  arming at A and wrapping at B while the sentence is being read. Nothing in the
  recess is operable or claims to be a track — see `LoopDemo.vue`.

  The header carried a "Not connected" line until this pass. The router sends a
  connected visitor away from this route, so that line could only ever print
  those two words on the screen that already is the not-connected state — a
  third statement of a bit the heading and the button both make.
-->
<template>
  <div class="sign-in">
    <header class="sign-in__header">
      <AppBrand class="sign-in__brand" />
    </header>

    <main class="sign-in__body">
      <div class="sign-in__column">
        <div class="sign-in__panel">
          <LoopDemo />
        </div>

        <div class="sign-in__content">
          <!-- Fixed copy with a fixed two-line composition at every width. -->
          <h1 class="sign-in__title">
            <span>Loop any</span>
            <span>passage</span>
          </h1>
          <p class="sign-in__copy">Rewindify uses your Spotify account for playback.</p>

          <!--
            Only ever the truth about what is in the way, so it sits above the
            button rather than replacing the invitation to try again. Inverted ink
            is the product's alert register; the accent is reserved for the loop.
          -->
          <p v-if="notice" id="sign-in-notice" class="sign-in__notice" role="alert">
            <AppIcon name="alert" :size="15" />
            <span>{{ notice }}</span>
          </p>

          <button
            type="button"
            class="sign-in__action cap-surface"
            :aria-describedby="notice ? 'sign-in-notice' : undefined"
            :disabled="!IS_CONFIGURED"
            @click="signIn()"
          >
            <AppIcon name="spotify" :size="18" />
            <span class="sign-in__action-label">Continue with Spotify</span>
          </button>
        </div>
      </div>
    </main>

    <footer class="sign-in__footer">
      <span>Eric Veliyulin · 2026</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

.sign-in {
  width: 100%;
  min-height: 100dvh;
  background: var(--surface-plate);
  color: var(--ink);
  display: flex;
  flex-direction: column;
}

.sign-in__header {
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
.sign-in__brand {
  font-size: 17px;

  @include screen-desktop {
    font-size: 15px;
  }
}

/* Centred in whatever room the chrome leaves, at every width. */
.sign-in__body {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 24px 16px;

  /* See the field's own short-plate rule: the gate closes up rather than pushing
     the key past the fold. */
  @media (height < 700px) {
    padding: 14px 16px;
  }

  @include screen-desktop {
    padding-inline: 32px;
  }
}

/*
 * A narrow plate keeps the proof and decision in one 460px reading column. On
 * desktop the same DOM order opens into two banks: the working field leads at
 * three shares, while the decision keeps two and never falls below the width
 * its fixed title and account sentence need. The 32px gap is the desktop
 * working-column gutter already established by the player.
 */
.sign-in__column {
  width: 100%;
  max-width: 460px;

  @include screen-desktop {
    max-width: 1000px;
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(360px, 2fr);
    align-items: center;
    gap: 32px;
  }
}

.sign-in__content {
  min-width: 0;
}

/*
 * The product's working panel, on the product's first screen: the same recess,
 * the same padding pair, the same field inside it. Nothing else on this plate
 * is cut into it, so the demonstration is the one place the eye lands first.
 */
.sign-in__panel {
  @include well(4px);
  padding: 18px 16px 16px;

  @include screen-wide-up {
    padding: 22px 22px 18px;
  }
}

/*
 * The gate takes the numeral steps — 46/64, the pair the position readout owns
 * on the player. It is the one screen in the product with no position on it, so
 * nothing here is outranked by a title set that large, and the heading gets to
 * be the voice of the page rather than a label on it. No new size enters the
 * ramp; the wide plate takes the desktop step because the reason to grow is the
 * plate, not the chrome.
 *
 * Set at Position's own weight and tracking, but a hair looser in the leading:
 * 0.9 never wraps on the player and this line always does, and two lines of
 * 64px at 0.9 close up into a single mass.
 */
.sign-in__title {
  margin: 28px 0 0;
  font-size: 46px;
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  text-wrap: balance;

  @include screen-wide-up {
    margin-top: 32px;
    font-size: 64px;
  }

  @media (height < 700px) {
    margin-top: 20px;
  }

  @include screen-desktop {
    margin-top: 0;
  }
}

.sign-in__title > span {
  display: block;
}

.sign-in__copy {
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.45;
  color: var(--ink-body);

  @include screen-wide-up {
    margin-top: 16px;
  }
}

.sign-in__notice {
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

  @media (height < 700px) {
    margin-top: 16px;
  }
}

.sign-in__action {
  @include cap;
  margin-top: 28px;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  @media (height < 700px) {
    margin-top: 20px;
  }

  // A build without a client id has nowhere to send anyone.
  &:disabled {
    background: var(--surface-well-deep);
    box-shadow: var(--shadow-well);
    color: var(--ink-label);
    cursor: not-allowed;
    transform: none;
  }
}

.sign-in__notice + .sign-in__action {
  margin-top: 10px;
}

@media (hover: hover) {
  .sign-in__action:not(:disabled):hover {
    background: linear-gradient(#474741, var(--cap-top));
  }
}

.sign-in__action-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.005em;
}

.sign-in__footer {
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

/* Sideways on a stand: demonstration and decision become two banks, keeping
   the action in the first viewport instead of asking for a scroll. */
@include screen-short-wide {
  .sign-in {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }

  .sign-in__header {
    height: 48px;
    padding: 0 18px;
  }

  .sign-in__body {
    align-items: safe center;
    justify-items: center;
    overflow-y: auto;
    padding: 8px 18px;
  }

  .sign-in__column {
    max-width: 808px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(340px, 1fr);
    align-items: center;
    gap: 18px;
  }

  .sign-in__panel {
    padding: 12px 14px 10px;
  }

  .sign-in__title {
    margin-top: 0;
  }

  .sign-in__copy {
    margin-top: 10px;
  }

  .sign-in__notice {
    margin-top: 12px;
  }

  .sign-in__action {
    margin-top: 18px;
  }

  .sign-in__notice + .sign-in__action {
    margin-top: 8px;
  }
}
</style>
