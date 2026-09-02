<script setup lang="ts">
/**
 * The passages drawer: a printed index of the spans saved on this track.
 *
 * Cut into the plate below the controls rather than floated over it, so The One
 * Popover Rule holds — the desktop search results remain the only thing in this
 * product that leaves the surface. The index is in `TrackRow`'s grammar:
 * hairline rules between siblings, a dotted leader carrying a title to its
 * figure, no cards and no outlines.
 *
 * The accent is spent in exactly one place here, on the row whose stored bounds
 * the loop is currently sitting on: a 3px `accent-strong` rail, which is the
 * timeline bracket's own material at a fifth scale beside the two rails, the two
 * boundary rules, the A/B markers and the nudger chips. It transitions on
 * `--arm-duration`, so applying a passage lights the bracket, the chips, the
 * switch label and the row together in the one sweep the system already owns —
 * an element added to The One Authored Moment, not a moment of its own.
 *
 * Its converse is the feature's real information. Nudge A by a second and the
 * orange leaves the row while the row keeps printing `0:30 – 1:00` and the
 * nudger starts printing `0:31`. Those are two different quantities — what was
 * stored, and where the loop is now — and their disagreement is the point.
 *
 * Nothing here prints whether the loop is on. That bit belongs to the switch
 * and the bracket, and a legend in this header would be a third home for it
 * under the Say-It-Once Rule; the disabled save control is the whole visible
 * statement, and its accessible name carries the reason.
 */
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { formatTime } from '@/playback/time';
import { PASSAGE_NAME_MAX, type SavedPassage } from '@/playback/passages';
import { usePlayerStore } from '@/stores/player';

withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), { variant: 'mobile' });

const player = usePlayerStore();

const naming = ref(false);
const draft = ref('');
const nameEl = useTemplateRef<HTMLInputElement>('name');

/** En dash, the form the panel footer used before it was cut. */
function timeRange(passage: SavedPassage) {
  return `${formatTime(passage.a)} – ${formatTime(passage.b)}`;
}

/** What the row prints as its identity, and what a delete label names. */
function identity(passage: SavedPassage) {
  return passage.name ?? timeRange(passage);
}

/**
 * The field's placeholder is the passage's own times, so an empty commit is
 * visibly the same as accepting them. That is what makes the name optional in
 * fact rather than in the docs: Enter on an untouched field stores no name and
 * the row prints these figures instead.
 */
const placeholder = computed(() => `${formatTime(player.loopA)} – ${formatTime(player.loopB)}`);

async function beginNaming() {
  if (player.savePassageBlocked !== null) return;
  draft.value = '';
  naming.value = true;
  await nextTick();
  nameEl.value?.focus();
}

function cancelNaming() {
  naming.value = false;
  draft.value = '';
}

/**
 * Enter and the Save control both land here.
 *
 * Enter is wired on the field explicitly rather than left to the form's
 * implicit submission: it is a promised part of the keyboard path — the whole
 * point of `S` is that pinning a passage never needs the pointer — and it is
 * not worth resting on a default action that a browser can decline to perform.
 * The `<form>` stays, because it is what makes the Save control a submit
 * control for everyone arriving by pointer.
 */
function commit() {
  player.savePassage(draft.value);
  cancelNaming();
}

/** `S` from anywhere on the surface, and the header's own save control. */
watch(() => player.passageSaveRequest, beginNaming);

/*
 * A shut drawer holds no half-typed name, and a name typed against one track's
 * bounds may not be committed against another's — the band stays open across a
 * track change so the new track's passages are already showing.
 */
watch(
  () => player.passagesOpen,
  (open) => {
    if (!open) cancelNaming();
  },
);
watch(() => player.currentTrack?.id, cancelNaming);

/**
 * Escape shuts the drawer, but only once it is not holding a field: the first
 * press abandons the name, the second puts the drawer away. Handled on the band
 * rather than on the window so it cannot reach past the search overlay.
 */
function onEscape() {
  if (naming.value) cancelNaming();
  else close();
}

function close() {
  player.closePassages();
  // Focus came from the handle and goes back to it; leaving it on a control
  // inside a shut drawer strands the keyboard on nothing.
  document.getElementById('passages-toggle')?.focus();
}
</script>

<template>
  <div class="band" :class="[`band--${variant}`, { 'is-open': player.passagesOpen }]">
    <div class="band__reveal">
      <section
        id="passages-band"
        class="band__panel"
        :inert="!player.passagesOpen"
        @keydown.esc.stop="onEscape"
      >
        <header class="band__header">
          <h2 class="band__title">Saved on this track</h2>
          <!-- Nomenclature carried to its control on a leader, the way the
               nudger rows and the printed index both do it. -->
          <span class="band__leader" aria-hidden="true" />
          <button
            v-if="!naming"
            type="button"
            class="band__save"
            :class="{ 'is-blocked': player.savePassageBlocked !== null }"
            :aria-disabled="player.savePassageBlocked !== null"
            :aria-label="player.savePassageBlocked ?? 'Save this passage'"
            @click="beginNaming()"
          >
            <AppIcon name="plus" :size="16" />
          </button>
        </header>

        <form v-if="naming" class="band__form" @submit.prevent="commit()">
          <input
            ref="name"
            v-model="draft"
            class="band__field"
            type="text"
            :placeholder="placeholder"
            :maxlength="PASSAGE_NAME_MAX"
            aria-label="Passage name, optional"
            autocomplete="off"
            spellcheck="false"
            @keydown.enter.prevent="commit()"
          />
          <button type="submit" class="band__commit">Save</button>
        </form>

        <ul v-if="player.trackPassages.length > 0" class="band__list">
          <li
            v-for="passage in player.trackPassages"
            :key="passage.id"
            class="band__item"
            :class="{ 'is-armed': passage.id === player.armedPassageId }"
          >
            <button
              type="button"
              class="band__row"
              :aria-current="passage.id === player.armedPassageId ? 'true' : undefined"
              @click="player.applyPassage(passage.id)"
            >
              <!-- Mounted on every row so it sweeps rather than appears, the
                   same reason the timeline's span is always in the tree. -->
              <span class="band__rail" aria-hidden="true" />
              <!-- The row centres its line; the line shares a baseline. Same
                   split `TrackRow` uses, and for the same reason: baseline
                   alignment on the row itself would drop the text to the top of
                   a box sized for a 40px tap target. -->
              <span class="band__line">
                <span class="band__name" :class="{ 'is-figure': passage.name === null }">
                  {{ identity(passage) }}
                </span>
                <template v-if="passage.name !== null">
                  <span class="band__row-leader" aria-hidden="true" />
                  <span class="band__times">{{ timeRange(passage) }}</span>
                </template>
              </span>
            </button>
            <button
              type="button"
              class="band__delete"
              :aria-label="`Delete passage ${identity(passage)}`"
              @click="player.deletePassage(passage.id)"
            >
              <AppIcon name="delete" :size="15" />
            </button>
          </li>
        </ul>
        <p v-else class="band__empty">Nothing saved on this track yet.</p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/media-queries' as *;
@use '@/styles/surfaces' as *;

/*
 * A drawer, not a plate leaving the slot: the reveal is a single grid row
 * growing from `0fr`, so a shut band contributes no height and no gap. Two cap
 * presses, the same derivation the search popover names, and no opacity — the
 * fade belongs to the loop's sweep, and a drawer coming out of a chassis does
 * not dissolve into one.
 */
.band {
  --lift-duration: calc(var(--press-duration) * 2);
  display: grid;
  grid-template-rows: 0fr;
  flex: none;
  transition: grid-template-rows var(--lift-duration) var(--ease-out);
}

.band.is-open {
  grid-template-rows: 1fr;
}

.band__reveal {
  min-height: 0;
  overflow: hidden;
}

/* The gap to the controls lives inside the reveal, so a shut drawer costs
   nothing rather than leaving its own gap behind on the plate. */
.band__panel {
  @include well(4px);
  margin-top: 14px;
  padding: 10px 12px 6px;
}

.band__header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
}

.band__title {
  @include legend(10px);
  flex: none;
  margin: 0;
}

.band__leader {
  flex: 1;
  min-width: 10px;
  border-bottom: 1px dotted var(--surface-edge);
  transform: translateY(-1px);
}

.band__save {
  @include cap-light;
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--ink);
}

/*
 * The documented disabled form: a recess inside a recess, at the label floor.
 * `aria-disabled` rather than `disabled` so the control stays focusable and
 * says why — the reason is never printed on the plate.
 */
.band__save.is-blocked {
  background: var(--surface-well-deep);
  box-shadow: var(--shadow-well);
  color: var(--ink-label);
  cursor: not-allowed;

  &:active {
    transform: none;
    box-shadow: var(--shadow-well);
  }
}

.band__form {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
}

.band__field {
  @include well;
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  border: 0;
  /* The recess and the caret carry focus here, the way the search field's do. */
  outline: none;
  color: var(--ink);
  font-size: 15px;

  &::placeholder {
    color: var(--ink-label);
  }
}

/*
 * The control-label register the loop switch and the passages handle both take,
 * rather than a fourth setting at 13px. A word on a cap in this system is
 * nomenclature, and the three of them are peers.
 */
.band__commit {
  @include cap-light;
  flex: none;
  height: 42px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--ink);
}

/*
 * Capped at three and a half rows, so a fourth is visibly clipped rather than
 * hidden: a half-row is the honest scroll affordance, and the cap is what keeps
 * the drawer's reflow of the working column bounded.
 */
.band__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 154px;
  overflow-y: auto;
  box-shadow: inset 0 1px 0 var(--surface-rule);
}

/* Hairline rules between peers: this is an index, not a stack of cards. */
.band__item {
  display: flex;
  align-items: center;
  gap: 4px;

  & + & {
    box-shadow: inset 0 1px 0 var(--surface-rule);
  }
}

.band__row {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 44px;
  /* 3px of rail and 9px of ground after it. */
  padding: 0 4px 0 12px;
  border-radius: 3px;
  text-align: left;
  transition: background-color var(--press-duration) ease;
}

/*
 * The one place this feature spends the accent: the boundary rule from the
 * timeline bracket, stood on end at row scale. It means what it means
 * everywhere else — this is the loop — and it sweeps from its centre on the
 * arm token so applying a passage is one gesture across the whole surface.
 */
.band__rail {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 0;
  width: 3px;
  border-radius: 2px;
  background: var(--accent-strong);
  opacity: 0;
  transform: scaleY(0);
  transition:
    opacity var(--arm-duration) var(--ease-out),
    transform var(--arm-duration) var(--ease-out);
}

.is-armed .band__rail {
  opacity: 1;
  transform: scaleY(1);
}

.band__line {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.band__name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.006em;
  color: var(--ink);
}

/*
 * An unnamed passage is identified *by* its times, so they take the row title's
 * own step rather than the supporting figure's. Same value, two registers, set
 * by which job it is doing in the row.
 */
.band__name.is-figure {
  @include figures;
  letter-spacing: -0.01em;
}

.band__row-leader {
  flex: 1;
  min-width: 10px;
  border-bottom: 1px dotted var(--surface-edge);
  transform: translateY(-3px);
}

.band__times {
  @include figures;
  flex: none;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--ink-label);
}

/* Print, not a cap: deleting a passage is the rarest thing in this drawer, and
   the Frequency Sets Material Rule keeps the material honest about that. */
.band__delete {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 3px;
  color: var(--ink-label);
}

.band__empty {
  margin: 0;
  padding: 12px 12px 14px;
  font-size: 13px;
  color: var(--ink-body);
  box-shadow: inset 0 1px 0 var(--surface-rule);
}

.band--desktop {
  .band__panel {
    margin-top: 16px;
    padding: 8px 12px 4px;
  }

  .band__header {
    min-height: 34px;
  }

  .band__save {
    width: 34px;
    height: 34px;
  }

  .band__field,
  .band__commit {
    height: 34px;
  }

  .band__field {
    padding: 0 9px;
    font-size: 13px;
  }

  /* Follows the register down with the loop label and the handle. */
  .band__commit {
    font-size: 12px;
  }

  .band__list {
    max-height: 140px;
  }

  .band__row {
    min-height: 40px;
  }

  .band__delete {
    width: 34px;
    height: 34px;
  }

  .band__empty {
    padding: 11px 12px 13px;
    font-size: 12px;
  }
}

/* The wide plate can afford a fourth row before it starts clipping. */
.band--mobile {
  @include screen-wide {
    .band__list {
      max-height: 198px;
    }
  }
}

@media (hover: hover) {
  .band__row:hover {
    background: var(--surface-raised);
  }

  .band__save:not(.is-blocked):hover,
  .band__commit:hover {
    background: linear-gradient(var(--surface-hi), var(--surface-raised));
  }

  .band__delete:hover {
    color: var(--ink);
    background: var(--surface-well-deep);
  }
}
</style>
