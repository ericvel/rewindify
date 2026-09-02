<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

const router = useRouter();
const session = useSessionStore();

/** Leaving the sign-in screen is the guard's job once the session is gone. */
async function signOut() {
  await session.disconnect();
  await router.replace({ name: 'sign-in' });
}
</script>

<template>
  <!--
    One subject, one action. The name states who is connected and the word acts
    on it. They are told apart by register, not by weight of surface: the name
    is sentence-case Meta, the action is a printed legend — the one pairing
    DESIGN.md says can never be confused for each other — and only the action
    answers a hover.

    "Sign out", not "Disconnect": this browser registers as a Spotify Connect
    playback device, so "disconnect" has a second, wrong meaning available on
    exactly this surface. The store method keeps the domain word; the label
    says the thing a person cannot misread.
  -->
  <div class="session">
    <span class="session__name">{{
      session.isConnected ? session.displayName : 'Not connected'
    }}</span>
    <button v-if="session.isConnected" type="button" class="session__out" @click="signOut()">
      Sign out
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
  // The Meta role, which DESIGN.md already assigns the session name: 12px/500
  // at +0.01em, the same setting as the album line. It was being uppercased in
  // the store, so it rendered as a legend while being declared as content —
  // which is what made it read as one of three near-identical printed labels.
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--ink-label);
  // A long Spotify display name is clipped rather than pushing the header
  // apart. `overflow: hidden` also lets the flex item shrink past its text, so
  // a narrow header squeezes this before it squeezes the action beside it.
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.session__out {
  // Printed, not raised. A cap in this world is a thing you press, and signing
  // out is the rarest action in the product — as a light cap it outweighed the
  // brand. The hairline under the word is the affordance `base.scss` already
  // gives every anchor, so the header's edge stays print.
  @include legend(11px);
  flex: none;
  display: inline-flex;
  align-items: center;
  // The target is bought with box height the rule never sees: text-decoration
  // paints under the glyphs, not under the box, so the word stays print while
  // the hit area clears the phone's 40px floor inside a 60px header.
  min-height: 44px;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--surface-edge);
  text-underline-offset: 0.28em;

  @include screen-desktop {
    font-size: 10px;
    min-height: 28px;
  }
}

@media (hover: hover) {
  .session__out:hover {
    color: var(--ink);
    text-decoration-color: var(--ink-body);
  }
}
</style>
