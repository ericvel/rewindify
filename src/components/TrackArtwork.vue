<script setup lang="ts">
import AppIcon from './AppIcon.vue';

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    size: number;
    /** Renders the drawn placeholder mark used on the now-playing artwork. */
    labelled?: boolean;
  }>(),
  { src: undefined, alt: '', labelled: false },
);

/** The mark keeps its proportion to the plate it sits in. */
const markSize = () => Math.round(props.size * 0.42);
</script>

<template>
  <div class="artwork" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="src" class="artwork__image" :src="src" :alt="alt" />
    <AppIcon v-else-if="labelled" class="artwork__mark" name="disc" :size="markSize()" />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/surfaces' as *;

/*
 * Artwork is a plate cut into the surface, so a missing cover reads as an empty
 * recess rather than as a broken image. The old hatch fill and its "art" caption
 * were placeholder art in placeholder type.
 */
.artwork {
  @include well(2px);
  position: relative;
  flex: none;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.artwork__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork__mark {
  color: var(--ink-label);
  opacity: 0.55;
}
</style>
