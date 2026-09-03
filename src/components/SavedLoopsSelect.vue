<script setup lang="ts">
/**
 * Saved loops: a printed window with a plate behind it.
 *
 * It shipped as a handle and a drawer — a cap printing `SAVED LOOPS · 5`, and a
 * recess cut into the plate underneath it holding a printed index. Two things
 * were wrong with that. The band was nine horizontal lines deep in about a
 * hundred pixels (a panel edge, a legend on a dotted leader, a rule over the
 * list, a rule between every pair of rows, and a dotted leader inside each named
 * one), which is print doing structure's job; and a shut drawer could tell you
 * how many spans were stored but not *which one you were playing*, which is the
 * only thing about them that changes what you do next.
 *
 * So it is a selector now. The window prints the saved loop the live loop is
 * actually sitting on, and the plate behind it is the list you pick from. That
 * plate leaves the surface, which used to be the search results' sole privilege
 * — the rule it answers to is no longer "exactly one popover" but "a chooser
 * leaves the surface, and nothing else does". Both are lists anchored to the
 * field you choose in; neither has anywhere on the plate to be.
 *
 * **The window is a recess, not a cap.** A word set on a cap in this system is
 * nomenclature — 13px/600 uppercase — and a loop's name is the user's own text,
 * which may no more be uppercased here than the session name may be in the
 * header. Content lives in recesses (the search query, the A and B figures, a
 * row title), so a control that prints content is a recess, and its label
 * follows the material down to `legend(10px)`.
 *
 * **The caret does not turn.** The plate is drawn *up* out of the window's slot
 * at both steps, so an upward caret states the direction of travel and is true
 * whether the plate is out or in. A caret that flipped on open would contradict
 * the gesture it belongs to.
 *
 * **The list has no rules in it.** A popover is a menu, not a printed index:
 * the plate is the container, the hover fill marks a row, and a clipped half-row
 * at the bottom is the scroll affordance. Name at the left, range at the right,
 * held apart by register and by tabular figures forming their own column — the
 * dotted leader that used to carry one to the other was the line this whole
 * pass exists to remove.
 *
 * The accent is spent in exactly one place, on the row whose stored bounds the
 * loop is currently sitting on: a 3px `accent-strong` rail, the timeline
 * bracket's own material at row scale, sweeping on `--arm-duration` so applying
 * a loop lights the bracket, the nudger chips, the switch label and the row
 * together in the one moment the system already owns. The window itself takes
 * no rail: it prints the loop's *name*, which states the same bit in words, and
 * a graphic beside it would be the second statement Say-It-Once exists to stop.
 *
 * Nothing here prints whether the loop is on. That bit belongs to the switch and
 * the bracket; the disabled save control is the whole visible statement, and its
 * accessible name carries the reason.
 */
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { formatTime } from '@/playback/time';
import { LOOP_NAME_MAX, type SavedLoop } from '@/playback/savedLoops';
import { usePlayerStore } from '@/stores/player';

const props = withDefaults(defineProps<{ variant?: 'mobile' | 'desktop' }>(), {
  variant: 'mobile',
});

const player = usePlayerStore();

const fieldEl = useTemplateRef<HTMLButtonElement>('field');
const plateEl = useTemplateRef<HTMLElement>('plate');
const listEl = useTemplateRef<HTMLElement>('list');
const nameEl = useTemplateRef<HTMLInputElement>('name');
const saveEl = useTemplateRef<HTMLButtonElement>('save');

const draft = ref('');

/** En dash, the form the panel footer used before it was cut. */
function timeRange(loop: SavedLoop) {
  return `${formatTime(loop.a)} – ${formatTime(loop.b)}`;
}

/** What a row prints as its identity, and what a delete label names. */
function identity(loop: SavedLoop) {
  return loop.name ?? timeRange(loop);
}

/** The saved loop the live loop is sitting on, or none. */
const armed = computed(
  () => player.trackSavedLoops.find((entry) => entry.id === player.armedSavedLoopId) ?? null,
);

/**
 * The window's value, and the one place the two empty states are told apart.
 *
 * `None saved` and `None` carry what the handle's printed count used to: with
 * nothing stored there is nothing to open, and with spans stored the live loop
 * is simply not one of them — which is the state a nudge leaves you in, and the
 * whole information content of the feature. Two words instead of a figure, in
 * the slot the figure would have needed anyway.
 */
const windowValue = computed(() => {
  if (armed.value) return identity(armed.value);
  return player.trackSavedLoops.length === 0 ? 'None saved' : 'None';
});

/** An unnamed loop is identified by its times, so the window sets them as one. */
const windowIsFigure = computed(() => armed.value !== null && armed.value.name === null);

/**
 * The field's placeholder is the loop's own times, so an empty commit is
 * visibly the same as accepting them. That is what makes the name optional in
 * fact rather than in the docs: Enter on an untouched field stores no name and
 * the row prints these figures instead.
 */
const placeholder = computed(() => `${formatTime(player.loopA)} – ${formatTime(player.loopB)}`);

const blocked = computed(() => player.saveLoopBlocked !== null);

function open() {
  const el = plateEl.value;
  if (el && !el.matches(':popover-open')) el.showPopover();
}

function close() {
  const el = plateEl.value;
  if (el && el.matches(':popover-open')) el.hidePopover();
}

/*
 * `savedLoopsOpen` is the one truth: `S`, applying a loop and committing one all
 * drive it, and this watcher is the only thing in the component that reaches for
 * the popover API.
 */
watch(
  () => player.savedLoopsOpen,
  (isOpen) => (isOpen ? open() : close()),
);

/*
 * The plate is a `manual`-free `auto` popover, so the browser keeps light
 * dismiss and Escape — and a press on the window counts as outside, which means
 * the plate is already gone by the time the window's own click lands. A click
 * that read the live state would draw it straight back out and the window would
 * never put it away, so a pointer press acts on the state it found. A keyboard
 * activation arrives with nothing dismissed before it and no press to read
 * (`detail` is 0), so it acts on the live state instead.
 */
let openAtPress = false;

function onPress() {
  openAtPress = plateEl.value?.matches(':popover-open') ?? false;
}

function onFieldClick(event: MouseEvent) {
  const wasOut = event.detail === 0 ? player.savedLoopsOpen : openAtPress;
  if (wasOut) player.closeSavedLoops();
  else player.openSavedLoops();
}

function onToggle(event: ToggleEvent) {
  if (event.newState === 'open') {
    player.openSavedLoops();
    return;
  }
  player.closeSavedLoops();
  draft.value = '';
  // Focus came from the field and goes back to it; a light dismiss onto some
  // other control is left alone, but a shut plate must not strand the keyboard
  // on the document body.
  if (document.activeElement === document.body) fieldEl.value?.focus();
}

/**
 * `S` from anywhere on the surface: open the plate and put the caret in the
 * field. With saving blocked there is no caret to give, so the focus goes to
 * the control that carries the reason as its accessible name — the reason is
 * never printed.
 */
watch(
  () => player.loopSaveRequest,
  async () => {
    open();
    await nextTick();
    if (blocked.value) saveEl.value?.focus();
    else nameEl.value?.focus();
  },
);

/*
 * A name typed against one track's bounds may not be committed against
 * another's. The plate stays open across a track change, so the new track's
 * saved loops are already showing.
 */
watch(
  () => player.currentTrack?.id,
  () => (draft.value = ''),
);

function commit() {
  if (blocked.value) return;
  player.saveLoop(draft.value);
  draft.value = '';
  // The new loop holds the live bounds, so it is the armed one: shutting the
  // plate leaves its name printed in the window, which is the confirmation.
  player.closeSavedLoops();
}

async function pick(loop: SavedLoop) {
  // Shut first, so the loop's 320ms sweep across the timeline, the chips and the
  // switch happens on the surface rather than behind a closing plate.
  player.closeSavedLoops();
  await player.applySavedLoop(loop.id);
}

function rows(): HTMLElement[] {
  return Array.from(listEl.value?.querySelectorAll<HTMLElement>('.select__row') ?? []);
}

/** Wraps, the way the search popover's own arrow walk does. */
function focusRow(index: number) {
  const all = rows();
  if (all.length === 0) return;
  all[(index + all.length) % all.length]?.focus();
}

/** Down from the field enters the list, the way a select does. */
async function enterList(from: 'first' | 'last') {
  open();
  await nextTick();
  focusRow(from === 'first' ? 0 : rows().length - 1);
}

async function remove(loop: SavedLoop, index: number) {
  player.deleteSavedLoop(loop.id);
  await nextTick();
  const all = rows();
  // The deleted row took the focus with it: land on whatever now occupies its
  // place, or on the field once there is nothing left to land on.
  if (all.length === 0) fieldEl.value?.focus();
  else all[Math.min(index, all.length - 1)]?.focus();
}
</script>

<template>
  <div class="select" :class="`select--${props.variant}`">
    <button
      id="saved-loops-toggle"
      ref="field"
      type="button"
      class="select__field"
      :aria-expanded="player.savedLoopsOpen"
      aria-controls="saved-loops-plate"
      @pointerdown="onPress()"
      @click="onFieldClick($event)"
      @keydown.down.prevent="enterList('first')"
      @keydown.up.prevent="enterList('last')"
    >
      <span class="select__legend">Saved loop</span>
      <span class="select__line">
        <span
          class="select__value"
          :class="{ 'is-empty': armed === null, 'is-figure': windowIsFigure }"
        >
          {{ windowValue }}
        </span>
        <!-- The plate is drawn up out of this slot at both steps, so the mark
             states the direction of travel and stays true in both states. -->
        <AppIcon
          class="select__caret"
          name="caret-up"
          :size="props.variant === 'desktop' ? 14 : 16"
        />
      </span>
    </button>

    <div
      id="saved-loops-plate"
      ref="plate"
      class="select__plate"
      popover="auto"
      role="group"
      aria-label="Saved loops on this track"
      @toggle="onToggle($event as ToggleEvent)"
    >
      <form class="select__form" @submit.prevent="commit()">
        <input
          ref="name"
          v-model="draft"
          class="select__name-field"
          type="text"
          :placeholder="placeholder"
          :maxlength="LOOP_NAME_MAX"
          :disabled="blocked"
          aria-label="Name for this loop (optional)"
          autocomplete="off"
          spellcheck="false"
          @keydown.enter.prevent="commit()"
        />
        <!--
          `aria-disabled` rather than `disabled` so the control stays focusable
          and can say why: the reason for a refused save is never printed on the
          plate, because loop on/off belongs to the switch and the bracket.
        -->
        <button
          ref="save"
          type="submit"
          class="select__commit"
          :class="{ 'is-blocked': blocked }"
          :aria-disabled="blocked"
          :aria-label="player.saveLoopBlocked ?? undefined"
        >
          Save
        </button>
      </form>

      <ul v-if="player.trackSavedLoops.length > 0" ref="list" class="select__list">
        <li
          v-for="(loop, index) in player.trackSavedLoops"
          :key="loop.id"
          class="select__item"
          :class="{ 'is-armed': loop.id === player.armedSavedLoopId }"
        >
          <button
            type="button"
            class="select__row"
            :aria-current="loop.id === player.armedSavedLoopId ? 'true' : undefined"
            @click="pick(loop)"
            @keydown.down.prevent="focusRow(index + 1)"
            @keydown.up.prevent="focusRow(index - 1)"
          >
            <!-- Mounted on every row so it sweeps rather than appears, the same
                 reason the timeline's span is always in the tree. -->
            <span class="select__rail" aria-hidden="true" />
            <span class="select__row-name" :class="{ 'is-figure': loop.name === null }">
              {{ identity(loop) }}
            </span>
            <!-- Only a named row states its range here: an unnamed one is
                 identified *by* that range, and printing it twice is the second
                 home Say-It-Once exists to refuse. -->
            <span v-if="loop.name !== null" class="select__times">{{ timeRange(loop) }}</span>
          </button>
          <button
            type="button"
            class="select__delete"
            :aria-label="`Delete saved loop ${identity(loop)}`"
            @click="remove(loop, index)"
          >
            <AppIcon name="delete" :size="15" />
          </button>
        </li>
      </ul>
      <p v-else class="select__empty">No loops saved on this track yet.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

/* Each variant states its own flex, because the two want opposite things: the
   desktop bay grows this control, and the phone's column must never stretch it
   vertically. */
.select {
  min-width: 0;
}

/*
 * A window cut into the plate: label screened above, value in the slot. The
 * stacked arrangement is what keeps the control to the footprint the old handle
 * had while still printing a name — laid out on one line the legend alone would
 * have eaten the value's width.
 */
.select__field {
  @include well;
  /* Anchor for the plate that comes up out of this slot. */
  anchor-name: --rewindify-saved-loops;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  width: 100%;
  text-align: left;
}

.select__legend {
  @include legend(10px);
}

.select__line {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* The Row Title register: this is a title in a row, and it truncates like one. */
.select__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600;
  letter-spacing: -0.006em;
  color: var(--ink);
}

/* No saved loop is in effect. Register carries the state, not a second colour. */
.select__value.is-empty {
  font-weight: 500;
  color: var(--ink-label);
}

.select__value.is-figure {
  @include figures;
  letter-spacing: -0.01em;
}

.select__caret {
  flex: none;
  color: var(--ink-label);
}

/*
 * The plate, drawn up out of the window's slot: the clip reveals from the
 * anchored bottom edge, the plate rises, the shadow lifts. The search results'
 * gesture on the other block edge — upward because the window sits low in both
 * layouts, with the working panel above it and forty pixels of chassis below.
 *
 * The reveal mirrors; the light does not. See the open state's clip.
 *
 * Two cap presses on the way out, one on the way back in, and deliberately no
 * opacity: the fade belongs to the loop's sweep, and a plate coming out of a
 * slot does not dissolve into one.
 */
.select__plate {
  --lift-duration: calc(var(--press-duration) * 2);

  position: fixed;
  position-anchor: --rewindify-saved-loops;
  /* Block-start, and right-aligned to the window it comes out of. */
  position-area: block-start span-inline-start;
  position-try-fallbacks: flip-block;
  min-width: anchor-size(--rewindify-saved-loops width);
  margin: 0;
  margin-block-end: 5px;
  padding: 4px;
  border: 0;
  border-radius: 4px;
  background: var(--surface-plate);

  translate: 0 6px;
  clip-path: inset(100% -44px 0 -44px);
  box-shadow: var(--shadow-popover-flush);
  pointer-events: none;

  transition:
    translate var(--press-duration) var(--ease-out),
    clip-path var(--press-duration) var(--ease-out),
    box-shadow var(--press-duration) var(--ease-out),
    display var(--press-duration) allow-discrete,
    overlay var(--press-duration) allow-discrete;

  &:popover-open {
    translate: 0 0;
    /*
     * Released on all four sides, which is where the mirror of the search
     * plate's clip stops holding. Popover is offset *downward* — 28px of blur
     * under a 10px offset spends 38px below the box and 18px above it — so the
     * search plate can pin its top at the box edge and lose nothing, and the
     * pin usefully keeps the spill off the field it comes out of. The bottom is
     * not that edge. Pinned here it cut the shadow dead along the plate's own
     * bottom line, leaving side shadows that stopped square at the corners and
     * a plate that read as a slab sliced rather than one lifted. So it spills,
     * over the window underneath — which is what a thing standing 10px off a
     * surface does to the surface, and the whole reason the lift reads.
     */
    clip-path: inset(-44px);
    box-shadow: var(--shadow-popover);
    pointer-events: auto;

    transition:
      translate var(--lift-duration) var(--ease-out),
      clip-path var(--lift-duration) var(--ease-out),
      box-shadow var(--lift-duration) var(--ease-out),
      display var(--lift-duration) allow-discrete,
      overlay var(--lift-duration) allow-discrete;

    @starting-style {
      translate: 0 6px;
      clip-path: inset(100% -44px 0 -44px);
      box-shadow: var(--shadow-popover-flush);
    }
  }
}

/*
 * Saving is the plate's own first object rather than a control in a header: the
 * header was a legend, a dotted leader and a hairline spent on a `+` that only
 * ever swapped itself for this form. The recess gives the plate a top edge
 * without a rule, which is the whole trade.
 */
.select__form {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.select__name-field {
  @include well;
  flex: 1;
  min-width: 0;
  padding: 0 10px;
  border: 0;
  /* The recess and the caret carry focus here, the way the search field's do. */
  outline: none;
  color: var(--ink);

  &::placeholder {
    color: var(--ink-label);
  }

  /* The slot goes dead with the control beside it, at the same Deep Well the
     disabled cap takes: a live-looking field next to a refused Save reads as a
     bug. The reason is never printed here — it is on the control. */
  &:disabled {
    background: var(--surface-well-deep);
    cursor: not-allowed;
  }
}

/* Nomenclature on a cap, in the register this system prints there. */
.select__commit {
  @include cap-light;
  flex: none;
  padding: 0 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--ink);
}

/* The documented disabled form: a recess inside a recess, at the label floor. */
.select__commit.is-blocked {
  background: var(--surface-well-deep);
  box-shadow: var(--shadow-well);
  color: var(--ink-label);
  cursor: not-allowed;

  &:active {
    transform: none;
    box-shadow: var(--shadow-well);
  }
}

/*
 * Capped so the row past the last visible one is clipped rather than hidden: a
 * half-row is the honest scroll affordance, and it is the only structure the
 * list needs now that the hairlines between rows are gone.
 */
.select__list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.select__item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.select__row {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  /* 3px of rail and 9px of ground after it. */
  padding: 0 4px 0 12px;
  border-radius: 3px;
  text-align: left;
  /* Held arrows walk the focus down several rows a second; a hard swap at that
     rate reads as flicker rather than as a marker moving. */
  transition: background-color var(--press-duration) ease;
  /* The list scrolls, so a ring at the standard 2px offset would be clipped
     against the scroll port. Inset, it sits on the row's own ground. */
  scroll-margin-block: 4px;

  &:focus-visible {
    outline-offset: -2px;
  }
}

/*
 * The one place this feature spends the accent: the boundary rule from the
 * timeline bracket, stood on end at row scale. It means what it means
 * everywhere else — this is the loop — and it sweeps from its centre on the arm
 * token, so applying a loop is one gesture across the whole surface.
 */
.select__rail {
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

.is-armed .select__rail {
  opacity: 1;
  transform: scaleY(1);
}

.select__row-name {
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
 * An unnamed loop is identified *by* its times, so they take the row title's
 * own step rather than the supporting figure's. Same value, two registers, set
 * by which job it is doing in the row.
 */
.select__row-name.is-figure {
  @include figures;
  letter-spacing: -0.01em;
}

/* Pushed to the right edge, where the tabular figures make their own column.
   No leader between: the column is the alignment, and the dotted rule carrying
   a title to its figure is the line this pass set out to remove. */
.select__times {
  @include figures;
  flex: none;
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--ink-label);
}

/* Print, not a cap: deleting a loop is the rarest thing on this plate, and the
   Frequency Sets Material Rule keeps the material honest about that. */
.select__delete {
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 3px;
  color: var(--ink-label);

  &:focus-visible {
    outline-offset: -2px;
  }
}

.select__empty {
  margin: 0;
  padding: 10px 12px 12px;
  color: var(--ink-body);
}

/*
 * Matched to the loop switch's height at both steps, and held to the footprint
 * the old handle had: the desktop controls row carries 826px of content — 212px
 * transport, 22px, 402px nudger, 14px, this — in a column that holds one line
 * down to a 1190px window.
 *
 * 176px is a resting width rather than a fixed one. Beside the nudger the bay's
 * `max-content` cap holds the control here; stacked under it, below that 1190px,
 * the control fills the line the way it does on the phone, so the slot never
 * sits short of the block above it.
 */
.select--desktop {
  flex: 1 1 176px;
  /* The bay caps itself at its own `max-content`, which is how it tracks the
     nudger's width without restating it — so what this control contributes to
     that measurement has to be the slot, never the name printed in it. Left
     intrinsic, a window holding `Bridge into the chorus` measured 187px and one
     holding `None` measured its floor, which made the resting width of the
     control and the width at which the row wraps both depend on which loop you
     had picked. The floor and the containment together pin the contribution at
     176px: the name is content in a slot, and it truncates the way a row title
     does rather than pushing the slot open. */
  min-width: 176px;
  contain: inline-size;

  .select__field {
    height: 52px;
    padding: 0 12px;
  }

  .select__value {
    font-size: 14px;
  }

  /* Wide enough that a name at `LOOP_NAME_MAX` fits the row whole: measured,
     the name column holds 166px once the range column, the delete mark and the
     scrollbar are paid for, and twenty-four characters of ordinary mixed case
     run 154–158px. The limit is the row's width expressed as a count, so it has
     to be true — a 26-character name saved under the old limit is the one that
     truncates, which is what the ellipsis is for.

     A floor rather than a ceiling: the base rule holds the plate to at least the
     slot it comes out of, so a stacked window wider than this is matched by its
     own plate instead of drawing a narrow one out of a wide slot. */
  .select__plate {
    width: 312px;
  }

  .select__name-field,
  .select__commit {
    height: 34px;
  }

  .select__name-field {
    font-size: 13px;
  }

  .select__commit {
    font-size: 12px;
  }

  /* Four rows and a fifth cut in half — `4 × 40 + 20`, derived from the row
     the way the phone's 198px is (`4 × 44 + 22`). It was 168px, which left 8px
     of the fifth row showing: too thin to read as a row and so it read as a
     stray band above the plate's bottom edge instead of as more list. */
  .select__list {
    max-height: 180px;
  }

  .select__row {
    min-height: 40px;
  }

  .select__delete {
    width: 34px;
    height: 34px;
  }

  .select__empty {
    font-size: 12px;
  }
}

/*
 * Full width, because the window sits under the nudger's own block and a narrow
 * control alone on the plate reads as unmoored. The plate matches it, so the
 * list opens exactly over the slot it came from.
 */
.select--mobile {
  flex: none;
  width: 100%;

  .select__field {
    height: 62px;
    padding: 0 16px;
  }

  /* Row Title's `lg` step: the phone gives this row a whole plate width. */
  .select__value {
    font-size: 15px;
  }

  .select__plate {
    width: anchor-size(--rewindify-saved-loops width);
  }

  .select__name-field,
  .select__commit {
    height: 42px;
  }

  .select__name-field {
    font-size: 15px;
  }

  .select__commit {
    font-size: 13px;
  }

  /* Four rows and a fifth cut in half: `4 × 44 + 22`. */
  .select__list {
    max-height: 198px;
  }

  .select__row {
    min-height: 44px;
  }

  .select__delete {
    width: 40px;
    height: 40px;
  }

  .select__empty {
    font-size: 13px;
  }
}

@media (hover: hover) {
  .select__row:hover {
    background: var(--surface-raised);
  }

  .select__commit:not(.is-blocked):hover {
    background: linear-gradient(var(--surface-hi), var(--surface-raised));
  }

  .select__delete:hover {
    color: var(--ink);
    background: var(--surface-well-deep);
  }
}
</style>
