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
 * the plate is the container, the row's own raise marks it, and a clipped
 * half-row at the bottom is the scroll affordance. Every row prints its range
 * in one right-hand column of tabular figures — a named row above its name, an
 * unnamed row alone — so the column a user scans for a span has no holes in it.
 * The dotted leader that used to carry a name to its figure was the line this
 * whole pass exists to remove.
 *
 * **The plate opens as a chooser, and becomes a creator when asked.** For one
 * round the name field and its `SAVE` cap were the plate's unconditional first
 * object. That put a text field in front of a user who had opened the list to
 * *pick* something, made the plate's heaviest object a dead control whenever
 * saving was refused, and left the first-run plate a form over an empty
 * sentence. `S` already carries the creation intent from anywhere on the
 * surface, so creation is what the `+` reveals and what `S` opens straight
 * into. The row it lives on is the same row the form takes, so revealing it
 * grows the control rather than pushing the list down.
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
 * the bracket. What the plate *does* print, once the form is open, is the reason
 * a save is refused — because the alternative was a dead form and silence, and
 * because the reason the count used to carry (`this track already holds twelve`)
 * was stated nowhere on the surface once the count came off the handle. A
 * printed reason is not a second home for loop on/off; it is the answer to a
 * question the user asked by pressing `S`.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { formatTime } from '@/playback/time';
import {
  LOOP_NAME_MAX,
  MAX_LOOPS_PER_TRACK,
  clampName,
  type SavedLoop,
} from '@/playback/savedLoops';
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
const addEl = useTemplateRef<HTMLButtonElement>('add');

const draft = ref('');

/** Whether the create row is showing the form or the `+` that reveals it. */
const formOpen = ref(false);

/**
 * What a screen reader is told about an act whose only other evidence is a
 * change of printed value.
 *
 * It lives outside the plate on purpose: saving and applying both *close* the
 * plate, so a region inside it would be taken out of the accessibility tree in
 * the same frame as the message it was carrying.
 */
const announcement = ref('');

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
 * The count, back — but only on the plate, and only where it decides something.
 *
 * On the handle it was a figure printed at rest for a question the user was not
 * in. On the create row it sits beside the control it qualifies, and at the
 * ceiling it is the whole explanation for a `SAVE` that will refuse: `12 · Full`
 * is the printed half of the reason the blocked control carries in words.
 */
const countLabel = computed(() => {
  const stored = player.trackSavedLoops.length;
  if (stored === 0) return null;
  return stored >= MAX_LOOPS_PER_TRACK ? `${stored} · Full` : `${stored} saved`;
});

/**
 * The field's placeholder is the loop's own times, so an empty commit is
 * visibly the same as accepting them. That is what makes the name optional in
 * fact rather than in the docs: Enter on an untouched field stores no name and
 * the row prints these figures instead.
 */
const placeholder = computed(() => `${formatTime(player.loopA)} – ${formatTime(player.loopB)}`);

const blocked = computed(() => player.saveLoopBlocked !== null);

/**
 * `:popover-open` through `matches` in a `try`: a DOM that does not implement
 * the selector throws rather than answering `false`, and this is read on every
 * press.
 */
function isPlateOpen() {
  const el = plateEl.value;
  if (!el) return false;
  try {
    return el.matches(':popover-open');
  } catch {
    return false;
  }
}

function open() {
  if (plateEl.value && !isPlateOpen()) plateEl.value.showPopover();
}

function close() {
  if (plateEl.value && isPlateOpen()) plateEl.value.hidePopover();
}

/*
 * The popover is the truth about whether the plate is out; the store is how the
 * rest of the surface *asks* for it.
 *
 * Those were the same thing for one round, with `savedLoopsOpen` as the single
 * source and this watcher as the only route to the popover API. Two instances
 * of this component exist across the breakpoint and only one is ever mounted, so
 * crossing it destroyed a standing popover — and removing a popover from the
 * document hides it *without* firing `toggle`. The fresh instance mounted
 * against a store that still said open, over a plate that was shut, and because
 * `openSavedLoops()` is idempotent every later press asked for a state the store
 * was already in, the watcher never fired, and `showPopover()` was never called
 * again. The pointer had no way back; `S` and the arrows did, because they reach
 * for `open()` directly.
 *
 * So the press drives the popover, `toggle` reports back to the store, and the
 * watcher only serves requests that come from elsewhere on the surface. A mount
 * reconciles to whatever the store is asking for, and an unmount withdraws the
 * request it can no longer serve.
 */
watch(
  () => player.savedLoopsOpen,
  (isOpen) => (isOpen ? open() : close()),
);

onMounted(() => {
  // Not `immediate: true` on the watcher above: that runs before the template
  // ref exists, so it would reconcile against a plate that is not there yet.
  if (player.savedLoopsOpen) open();
});

onUnmounted(() => player.closeSavedLoops());

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
  openAtPress = isPlateOpen();
}

function onFieldClick(event: MouseEvent) {
  const wasOut = event.detail === 0 ? isPlateOpen() : openAtPress;
  if (wasOut) close();
  else open();
}

/** Re-armed for every message, so two identical ones are two announcements. */
async function announce(message: string) {
  announcement.value = '';
  await nextTick();
  announcement.value = message;
}

/**
 * The armed row is the one thing the plate exists to let you change, and it can
 * be below the fold: the port holds four and a half rows and a track holds
 * twelve. `nearest` so a row already in view does not jerk the list.
 */
async function scrollArmedIntoView() {
  await nextTick();
  const row = listEl.value?.querySelector<HTMLElement>('.is-armed .select__row');
  row?.scrollIntoView?.({ block: 'nearest' });
}

function onToggle(event: ToggleEvent) {
  if (event.newState === 'open') {
    player.openSavedLoops();
    void scrollArmedIntoView();
    return;
  }
  player.closeSavedLoops();
  draft.value = '';
  formOpen.value = false;
  // Focus came from the field and goes back to it; a light dismiss onto some
  // other control is left alone, but a shut plate must not strand the keyboard
  // on the document body.
  if (document.activeElement === document.body) fieldEl.value?.focus();
}

/**
 * The create row, opened. With saving blocked there is no caret worth giving, so
 * the focus goes to the control that carries the reason — which the row now also
 * prints, so the answer arrives whether or not anything is reading it aloud.
 */
async function revealForm() {
  formOpen.value = true;
  await nextTick();
  if (blocked.value) saveEl.value?.focus();
  else nameEl.value?.focus();
}

/** `S` from anywhere on the surface: open the plate, and open the form in it. */
watch(
  () => player.loopSaveRequest,
  async () => {
    open();
    await revealForm();
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

/**
 * `maxlength` counted UTF-16 units, which let four family emoji fill the field
 * and then cut the fifth apart at its joiners. The limit is a count of
 * characters the caret moves over, so the field enforces it the same way.
 */
function onNameInput() {
  const clamped = clampName(draft.value, LOOP_NAME_MAX);
  if (clamped !== draft.value) draft.value = clamped;
}

function commit() {
  if (blocked.value) return;
  const typed = draft.value.trim();
  player.saveLoop(draft.value);
  draft.value = '';
  void announce(`Saved loop ${typed === '' ? placeholder.value : typed}`);
  // The new loop holds the live bounds, so it is the armed one: shutting the
  // plate leaves its name printed in the window, which is the confirmation.
  player.closeSavedLoops();
}

async function pick(loop: SavedLoop) {
  // Shut first, so the loop's 320ms sweep across the timeline, the chips and the
  // switch happens on the surface rather than behind a closing plate.
  player.closeSavedLoops();
  await player.applySavedLoop(loop.id);
  void announce(`Loop ${identity(loop)} applied, playing from ${formatTime(loop.a)}`);
}

function rows(): HTMLElement[] {
  return Array.from(listEl.value?.querySelectorAll<HTMLElement>('.select__row') ?? []);
}

/**
 * Clamped, where the search popover's arrow walk wraps.
 *
 * The two lists are walked differently because they are walked for different
 * reasons. A search result is one of many and the list is being scanned; a saved
 * loop is being *returned to*, with an instrument in the way, and an arrow that
 * fell off the bottom onto the top would move you eleven rows from the one you
 * were next to. The top of the list keeps an exit instead: up from the first row
 * lands on the create control, so the walk is a line with two ends rather than a
 * closed circle with no way back to the form.
 */
function focusRow(index: number) {
  const all = rows();
  if (all.length === 0) return;
  all[Math.max(0, Math.min(index, all.length - 1))]?.focus();
}

function focusCreate() {
  (formOpen.value ? nameEl.value : addEl.value)?.focus();
}

function onRowUp(index: number) {
  if (index === 0) focusCreate();
  else focusRow(index - 1);
}

/** Down from the field enters the list — at the loop you are on, not at its top. */
async function enterList(from: 'first' | 'last') {
  open();
  await nextTick();
  const all = rows();
  if (all.length === 0) {
    focusCreate();
    return;
  }
  if (from === 'last') {
    focusRow(all.length - 1);
    return;
  }
  const armedIndex = player.trackSavedLoops.findIndex(
    (entry) => entry.id === player.armedSavedLoopId,
  );
  focusRow(armedIndex >= 0 ? armedIndex : 0);
}

async function remove(loop: SavedLoop, index: number) {
  const label = identity(loop);
  player.deleteSavedLoop(loop.id);
  void announce(`Deleted loop ${label}`);
  await nextTick();
  const all = rows();
  // The deleted row took the focus with it: land on whatever now occupies its
  // place, or on the field once there is nothing left to land on.
  if (all.length === 0) fieldEl.value?.focus();
  else all[Math.min(index, all.length - 1)]?.focus();
}

/**
 * Two stages, the way the drawer this replaced had them: the first press
 * abandons a half-typed name, the second puts the plate away.
 *
 * The second stage does not prevent the default, so the browser's own close
 * watcher still runs — `hidePopover()` on an already-closing popover is a
 * no-op, and this is a fallback for a UA that does not close on Escape rather
 * than a replacement for the one that does.
 */
function onEscape(event: KeyboardEvent) {
  if (draft.value !== '') {
    event.preventDefault();
    draft.value = '';
    nameEl.value?.focus();
    return;
  }
  close();
}

function plateFocusables(): HTMLElement[] {
  return Array.from(
    plateEl.value?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') ??
      [],
  );
}

/**
 * Tab stays on the plate while the plate is out.
 *
 * Without this it walked off the last row's delete mark and onto the surface
 * *behind* an open plate — a keyboard on controls it could not see, under a
 * chooser that was still covering them. Escape above and light dismiss are both
 * ways out, so holding the ring is safe.
 */
function onTab(event: KeyboardEvent) {
  const focusables = plateFocusables();
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>

<template>
  <div class="select" :class="`select--${props.variant}`">
    <button
      id="saved-loops-toggle"
      ref="field"
      type="button"
      class="select__field"
      aria-haspopup="true"
      aria-describedby="saved-loops-hint"
      :aria-expanded="player.savedLoopsOpen"
      aria-controls="saved-loops-plate"
      @pointerdown="onPress()"
      @click="onFieldClick($event)"
      @keydown.down.prevent="enterList('first')"
      @keydown.up.prevent="enterList('last')"
    >
      <span class="select__legend">Saved loop</span>
      <span class="select__line">
        <!-- The user's own text, so the paragraph direction is the text's to
             set: an RTL name in an LTR row resolves its own edges. -->
        <span
          class="select__value"
          dir="auto"
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

    <!-- Printed nowhere: the arrow walk has no mark on the plate, because a
         printed hint here is the header this pass removed. It is still the
         field's to declare. -->
    <span id="saved-loops-hint" class="select__offscreen">
      Up and down arrows walk the saved loops on this track.
    </span>

    <!-- Outside the plate, so a message survives the plate that closes on the
         act it describes. -->
    <span class="select__offscreen" role="status" aria-live="polite">{{ announcement }}</span>

    <div
      id="saved-loops-plate"
      ref="plate"
      class="select__plate"
      popover="auto"
      role="group"
      aria-label="Saved loops on this track"
      @toggle="onToggle($event as ToggleEvent)"
      @keydown.esc="onEscape($event)"
      @keydown.tab="onTab($event)"
    >
      <div class="select__create">
        <!--
          The `+` and the form take the same row, so revealing one grows the
          control rather than pushing the list down. It is never disabled: a
          refused save is a thing to be *told*, and the form is where the telling
          happens.
        -->
        <template v-if="!formOpen">
          <button
            ref="add"
            type="button"
            class="select__add"
            aria-label="Name and save the current loop"
            @click="revealForm()"
          >
            <AppIcon name="plus" :size="props.variant === 'desktop' ? 14 : 16" />
          </button>
          <span v-if="countLabel" class="select__count">{{ countLabel }}</span>
        </template>

        <form v-else class="select__form" @submit.prevent="commit()">
          <input
            ref="name"
            v-model="draft"
            class="select__name-field"
            type="text"
            :placeholder="placeholder"
            :disabled="blocked"
            aria-label="Name for this loop (optional)"
            autocomplete="off"
            spellcheck="false"
            dir="auto"
            @input="onNameInput()"
            @keydown.enter.prevent="commit()"
          />
          <!--
            `aria-disabled` rather than `disabled` so the control stays focusable
            and can be reached to be read. The reason is `describedby` rather
            than the accessible name, which it used to replace — a cap printing
            SAVE whose name was "This loop is already saved" could not be reached
            by anyone asking for the Save button by name.
          -->
          <button
            ref="save"
            type="submit"
            class="select__commit"
            :class="{ 'is-blocked': blocked }"
            :aria-disabled="blocked"
            :aria-describedby="blocked ? 'saved-loops-reason' : undefined"
          >
            Save
          </button>
        </form>
      </div>

      <!-- Only once the user has asked to save. Printed then because the answer
           is otherwise nowhere on the surface at the ceiling, and because on the
           phone the plate covers the switch that states the other cases. -->
      <p v-if="formOpen && player.saveLoopBlocked" id="saved-loops-reason" class="select__reason">
        {{ player.saveLoopBlocked }}
      </p>

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
            @keydown.up.prevent="onRowUp(index)"
            @keydown.home.prevent="focusRow(0)"
            @keydown.end.prevent="focusRow(player.trackSavedLoops.length - 1)"
            @keydown.delete.prevent="remove(loop, index)"
          >
            <!-- Mounted on every row so it sweeps rather than appears, the same
                 reason the timeline's span is always in the tree. -->
            <span class="select__rail" aria-hidden="true" />
            <span v-if="loop.name !== null" class="select__row-name" dir="auto">
              {{ loop.name }}
            </span>
            <!-- Every row, one column. A named row is a title over its range; an
                 unnamed row is the range alone, in the same place, so the column
                 a user scans for a span is never broken by the rows that have no
                 name to sit above it. -->
            <span class="select__times">{{ timeRange(loop) }}</span>
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
      <!-- A recess, so an empty plate is still an object: plate-toned ink on a
           plate-toned ground over a plate-toned page had only the drop shadow
           holding it off the surface, and it read as a sentence printed on the
           page rather than as a chooser standing open. -->
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

/* Carried to an assistive technology and to nothing else. Not `display: none`,
   which would take it out of the accessibility tree along with the layout. */
.select__offscreen {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
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
 *
 * `position-try-fallbacks: flip-block` used to sit here and is gone. The clip
 * that carries the whole gesture is pinned to the bottom edge, and a fallback
 * mirrors the *position* without mirroring it — so the one time the fallback
 * ever fired, the plate would have peeled open from an edge it was not attached
 * to. The player brief already documents what a short viewport does instead:
 * the controls row scrolls out of the column and the plate goes with it.
 */
.select__plate {
  --lift-duration: calc(var(--press-duration) * 2);

  position: fixed;
  position-anchor: --rewindify-saved-loops;
  /* Block-start, and right-aligned to the window it comes out of. */
  position-area: block-start span-inline-start;
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
 * The plate's own first object, and one row whichever thing is in it. Shut, it
 * is a `+` and the count; open, it is the field and its cap. The recess in
 * either state gives the plate a top edge without a rule, which is the whole
 * trade.
 */
.select__create {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.select__add {
  @include cap-light;
  flex: none;
  display: grid;
  place-items: center;
  color: var(--ink);
}

/* Beside the control it qualifies, in the register this system prints a figure
   on a plate. `12 · Full` is the printed half of a refused save. */
.select__count {
  @include legend(10px);
  @include figures;
  margin-left: auto;
  padding-right: 4px;
}

.select__form {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
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
     bug. The reason is printed below, not here. */
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
 * Sentence case, not a legend: this is a sentence the store wrote, and the
 * legend register is for nomenclature. Body ink so it reads as the answer to a
 * question rather than as a label on the row above it.
 */
.select__reason {
  margin: 0 0 4px;
  padding: 0 4px 4px;
  color: var(--ink-body);
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

/*
 * Eight, not two. The delete mark used to sit two pixels from the row that
 * applies the loop — a destructive target inside the slop of a reach for the
 * primary one, and the smallest target on the plate at every width. It is the
 * gap that does the work here, because the act itself is deliberately still one
 * press: the loop is cheap enough to lose that a confirmation would cost more
 * than it saves, which makes not hitting it by accident the whole defence.
 */
.select__item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select__row {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  /* 3px of rail and 9px of ground after it. */
  padding: 0 8px 0 12px;
  border-radius: 3px;
  text-align: left;
  /* Held arrows walk the focus down several rows a second; a hard swap at that
     rate reads as flicker rather than as a marker moving. */
  transition:
    background var(--press-duration) ease,
    box-shadow var(--press-duration) ease,
    transform var(--press-duration) ease;
  /* The list scrolls, so a ring at the standard 2px offset would be clipped
     against the scroll port. Inset, it sits on the row's own ground. */
  scroll-margin-block: 4px;

  &:focus-visible {
    outline-offset: -2px;
  }

  /*
   * Outside the hover query on purpose. A row is a control, and every other
   * control in this system presses; this one had a hover fill worth 1.07:1
   * against the plate and nothing at all under a finger, so a tap on the phone
   * produced no acknowledgement until the plate closed on top of the answer.
   * Depth is what this world has that a tint does not.
   */
  &:active {
    background: var(--surface-well);
    box-shadow: var(--shadow-cap-light-pressed);
    transform: translateY(1px);
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

.select__empty {
  @include well;
  margin: 0;
  padding: 10px 12px 12px;
  color: var(--ink-body);
}

/*
 * Matched to the loop switch's height at both steps, and held to the footprint
 * the old handle had: the desktop controls row carries 826px of content — 212px
 * transport, 22px, 402px nudger, 14px, this — in a column that holds one line
 * down to a 1190px window. The step preference lives in the chassis strip, so
 * it no longer interrupts this practice path or changes the row's wrap point.
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

  /* 312px held a 40px delete mark two pixels from its row. Twelve more pay for
     the eight-pixel gap and the six the mark grew by, so the name column keeps
     the ~160px that twenty-four characters of ordinary mixed case run in.

     Note what the limit is not: twenty-four *wide* glyphs run past 230px and
     twenty-four CJK glyphs further still, so `LOOP_NAME_MAX` is the row's width
     as a count for Latin text and the ellipsis covers the rest. It also covers
     the resting window, which is 176px and cannot print a maximum-length name
     whole at any breakpoint — the list is where a long name is read.

     A floor rather than a ceiling: the base rule holds the plate to at least the
     slot it comes out of, so a stacked window wider than this is matched by its
     own plate instead of drawing a narrow one out of a wide slot. */
  .select__plate {
    width: 324px;
  }

  .select__add,
  .select__name-field,
  .select__commit {
    height: 34px;
  }

  .select__add {
    width: 34px;
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

  /* Square with the row, where it used to be six pixels under it. */
  .select__delete {
    width: 40px;
    height: 40px;
  }

  .select__empty,
  .select__reason {
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

  /* The field now takes the full practice-control width. Keep the viewport
     floor as protection for embedded or unusually narrow containers, and let
     the plate follow the field anywhere wider. */
  .select__plate {
    width: max(anchor-size(--rewindify-saved-loops width), min(304px, 100vw - 32px));
  }

  .select__add,
  .select__name-field,
  .select__commit {
    height: 42px;
  }

  .select__add {
    width: 42px;
  }

  .select__name-field {
    font-size: 15px;
  }

  .select__commit {
    font-size: 13px;
  }

  /* Four rows and a fifth cut in half: `4 × 44 + 22`.
     It was three and a half for a round, to keep the open plate clear of the
     loop switch and the A/B cells — the rows that used to be the only statement
     of why a save was refused. Measured, that does not work: the plate opens
     upward from a field 62px off the chassis and would have to be under 115px
     to clear the switch, which is the create row and one loop. The reason is
     printed on the plate now, so the switch is no longer the answer the plate
     was covering, and the fifth half-row is worth more than the clearance. */
  .select__list {
    max-height: 198px;
  }

  .select__row {
    min-height: 44px;
  }

  .select__delete {
    width: 44px;
    height: 44px;
  }

  .select__empty,
  .select__reason {
    font-size: 13px;
  }
}

/* Print, not a cap: deleting a loop is the rarest thing on this plate, and the
   Frequency Sets Material Rule keeps the material honest about that. It still
   presses — see the row. */
.select__delete {
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 3px;
  color: var(--ink-label);
  transition:
    background-color var(--press-duration) ease,
    color var(--press-duration) ease;

  &:focus-visible {
    outline-offset: -2px;
  }

  &:active {
    color: var(--ink);
    background: var(--surface-well-deep);
  }
}

@media (hover: hover) {
  .select__row:hover {
    background: linear-gradient(var(--surface-raised), var(--surface-plate));
    box-shadow: var(--shadow-cap-light);
  }

  .select__commit:not(.is-blocked):hover,
  .select__add:hover {
    background: linear-gradient(var(--surface-hi), var(--surface-raised));
  }

  .select__delete:hover {
    color: var(--ink);
    background: var(--surface-well-deep);
  }
}
</style>
