<script setup lang="ts">
/**
 * The drawn icon set. Every glyph sits on the same 24-unit grid at the same
 * 1.75 stroke, so a step key and a search field read as parts of one machine.
 *
 * Transport marks (play, pause) are filled, which is the convention every
 * physical transport uses; everything else is stroked. Nothing here is a
 * Unicode character standing in for an icon.
 *
 * The step chevrons carry no track-boundary bar: a bar makes them read as
 * "skip to the start of the track", which is the one thing these keys do not
 * do. Bare chevrons plus the printed second count say what they are.
 */
type IconName =
  | 'step-back'
  | 'step-forward'
  | 'play'
  | 'pause'
  | 'search'
  | 'close'
  | 'eject'
  | 'minus'
  | 'plus'
  | 'alert'
  | 'disc';

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 });

/** Stroked paths, drawn once at one weight. */
const STROKES: Partial<Record<IconName, string>> = {
  'step-back': 'M11 7.5 6.5 12 11 16.5M17.5 7.5 13 12 17.5 16.5',
  'step-forward': 'M6.5 7.5 11 12 6.5 16.5M13 7.5 17.5 12 13 16.5',
  search: 'M15.5 15.5 20 20M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  eject: 'M12 5.5 5.5 13.5h13L12 5.5ZM5.5 18.5h13',
  minus: 'M5.5 12h13',
  plus: 'M5.5 12h13M12 5.5v13',
  alert: 'M12 4.5 2.8 20.5h18.4L12 4.5ZM12 10v4.4M12 17.4v.2',
  disc: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM13.6 12a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0Z',
};

/** Filled paths, for the transport marks only. */
const FILLS: Partial<Record<IconName, string>> = {
  play: 'M8 5.4v13.2a.7.7 0 0 0 1.07.6l10.4-6.6a.7.7 0 0 0 0-1.2L9.07 4.8A.7.7 0 0 0 8 5.4Z',
  pause: 'M7 5h3.4v14H7zM13.6 5H17v14h-3.4z',
};
</script>

<template>
  <svg
    class="icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-if="STROKES[name]"
      :d="STROKES[name]"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path v-if="FILLS[name]" :d="FILLS[name]" fill="currentColor" />
  </svg>
</template>

<style scoped lang="scss">
.icon {
  display: block;
  flex: none;
}
</style>
