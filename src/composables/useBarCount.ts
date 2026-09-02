import { computed, onBeforeUnmount, onMounted, ref, type ShallowRef } from 'vue';

/**
 * How many waveform bars fit a field, at the one pitch the system fixes.
 *
 * The count is not a constant in this design, the *pitch* is: bars are objects
 * rather than texture, so a bar keeps its size and the field decides how many
 * of them there are. Both plates are fluid — the phone is the window, and the
 * desktop working column is whatever is left beside a 300px sidebar — so a flat
 * count meant a 3px bar on a 900px desktop window and a 6px one at 1200px, and
 * a 16px slab on a 900px phone plate.
 *
 * 7.6px is a 5.6px bar on the field's own 2px gap. It is the pitch the phone
 * shipped with (48 bars at 430px), which is why the phone renders exactly what
 * it did before at phone width.
 */
const BAR_PITCH = 7.6;

/** Enough bars to still read as a waveform; enough of a ceiling for a wall display. */
const MIN_BARS = 24;
const MAX_BARS = 320;

/**
 * Pass the element whose *content box* is the field — the recessed panel, whose
 * padding is the only thing between it and the timeline. Measuring the panel
 * rather than the viewport keeps the sidebar, the gutters and the recess out of
 * the arithmetic.
 */
export function useBarCount(panel: Readonly<ShallowRef<HTMLElement | null>>) {
  const fieldWidth = ref(0);

  function measure(el: HTMLElement) {
    const { paddingLeft, paddingRight } = getComputedStyle(el);
    fieldWidth.value = el.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight);
  }

  // Guarded for jsdom, which has no ResizeObserver: the unit tests mount both
  // views, and a layout convenience may not be the thing that stops them.
  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(([entry]) => {
          if (entry) measure(entry.target as HTMLElement);
        });

  // Measured once on mount as well as observed: the observer's first callback
  // lands after a frame, and a frame of the wrong count is a frame of a
  // different waveform.
  onMounted(() => {
    const el = panel.value;
    if (!el) return;
    measure(el);
    observer?.observe(el);
  });
  onBeforeUnmount(() => observer?.disconnect());

  return computed(() =>
    Math.min(MAX_BARS, Math.max(MIN_BARS, Math.round(fieldWidth.value / BAR_PITCH))),
  );
}
