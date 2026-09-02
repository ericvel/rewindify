import { onMounted, onUnmounted, ref } from 'vue';
import { usePlayerStore } from '@/stores/player';

/**
 * The keyboard control surface, mounted by both player views.
 *
 * It used to live inside `DesktopPlayerView`, which meant every keyboard-equipped
 * window under the 900px breakpoint (`src/styles/media-queries.scss`) got no
 * space, no arrow step, no `L` and no A/B-hold nudge. PRODUCT.md makes
 * keyboard-complete a requirement rather than a courtesy — the primary user's
 * hands are on an instrument — and says neither view may be the degraded case,
 * so the layer belongs to the player, not to one breakpoint.
 */

/** Elements that own these keys themselves; the global shortcut stands down. */
const INTERACTIVE = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']);

function ownsKeyboard(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return INTERACTIVE.has(target.tagName) || target.isContentEditable;
}

/** A or B held down turns the arrows into a nudge of that loop point. */
const LOOP_KEYS: Record<string, 'a' | 'b'> = { a: 'a', b: 'b' };
const NUDGE_SECONDS = 1;

/** Arrows skip on release, so their keyup is the commit. */
const ARROW_KEYS = new Set(['ArrowLeft', 'ArrowRight']);

export function usePlayerKeyboard() {
  const player = usePlayerStore();

  /** Which loop point the arrows are currently aimed at, for the key legends. */
  const heldPoint = ref<'a' | 'b' | null>(null);

  function onKeydown(event: KeyboardEvent) {
    if (ownsKeyboard(event.target)) return;
    const point = LOOP_KEYS[event.key.toLowerCase()];
    if (point) {
      event.preventDefault();
      heldPoint.value = point;
    } else if (event.key === ' ' || event.code === 'Space') {
      event.preventDefault();
      void player.togglePlay();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (heldPoint.value) player.nudge(heldPoint.value, -NUDGE_SECONDS);
      else player.stepSkip(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (heldPoint.value) player.nudge(heldPoint.value, NUDGE_SECONDS);
      else player.stepSkip(1);
    } else if (event.key.toLowerCase() === 'l') {
      event.preventDefault();
      player.toggleLoop();
    } else if (event.key.toLowerCase() === 's') {
      // Pinning a passage happens mid-practice, with both hands busy: one key
      // opens the band and puts the caret in the name field, so the frequent
      // path never needs the pointer. `ownsKeyboard` above is what keeps this
      // from firing while that field is being typed into.
      event.preventDefault();
      player.requestPassageSave();
    }
  }

  function onKeyup(event: KeyboardEvent) {
    if (LOOP_KEYS[event.key.toLowerCase()] === heldPoint.value) heldPoint.value = null;
    // Releasing an arrow is what commits the skip: the repeats only moved the
    // playhead on screen, so one seek lands here instead of one per repeat.
    if (ARROW_KEYS.has(event.key)) void player.endScrub();
  }

  /** A key released while the window is away never reaches us; drop the hold. */
  function onBlur() {
    heldPoint.value = null;
    // The release that would have committed a held arrow is gone with the
    // focus, so commit here rather than stranding the playhead mid-skip.
    void player.endScrub();
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('keyup', onKeyup);
    window.addEventListener('blur', onBlur);
  });
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('keyup', onKeyup);
    window.removeEventListener('blur', onBlur);
  });

  return { heldPoint };
}
