<script setup lang="ts">
/**
 * The icon set, drawn by Phosphor rather than by hand. One family on one
 * 256-unit grid, so a step key and a search field still read as parts of one
 * machine — the reason the glyphs were drawn together in the first place.
 *
 * Two weights, and only two. Transport marks (play, pause) take `fill`, which
 * is the convention every physical transport uses; everything else takes
 * `regular`, whose 16/256 stroke is the family's closest match to the 1.75 the
 * hand-drawn set carried. No mixing beyond that: a third weight on one glyph
 * would read as a mistake at these sizes.
 *
 * `rewind` is the app mark rather than a control — the twin left triangles the
 * name is about — so it is filled like the transport marks it belongs to.
 *
 * The step keys are bare double carets, carrying no track-boundary bar: a bar
 * makes them read as "skip to the start of the track", which is the one thing
 * these keys do not do. Carets plus the printed second count say what they are.
 */
import type { Component } from 'vue';
import {
  PhCaretDoubleLeft,
  PhCaretDoubleRight,
  PhDisc,
  PhMagnifyingGlass,
  PhMinus,
  PhPause,
  PhPlay,
  PhPlus,
  PhRewind,
  PhWarning,
  PhX,
} from '@phosphor-icons/vue';

type IconName =
  | 'step-back'
  | 'step-forward'
  | 'play'
  | 'pause'
  | 'search'
  | 'close'
  | 'minus'
  | 'plus'
  | 'alert'
  | 'disc'
  | 'rewind';

const props = withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 });

/** Every name the app asks for, paired with the Phosphor glyph that answers it. */
const GLYPHS: Record<IconName, Component> = {
  'step-back': PhCaretDoubleLeft,
  'step-forward': PhCaretDoubleRight,
  play: PhPlay,
  pause: PhPause,
  search: PhMagnifyingGlass,
  close: PhX,
  minus: PhMinus,
  plus: PhPlus,
  alert: PhWarning,
  disc: PhDisc,
  rewind: PhRewind,
};

/** The filled three. Everything absent from this set is stroked. */
const FILLED = new Set<IconName>(['play', 'pause', 'rewind']);
</script>

<template>
  <component
    :is="GLYPHS[props.name]"
    class="icon"
    :size="props.size"
    :weight="FILLED.has(props.name) ? 'fill' : 'regular'"
    aria-hidden="true"
    focusable="false"
  />
</template>

<style scoped lang="scss">
.icon {
  display: block;
  flex: none;
}
</style>
