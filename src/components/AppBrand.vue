<script setup lang="ts">
/**
 * The app mark and the name, as one unit. Four screens print the brand, so the
 * pairing lives here rather than four times over; a view sets only the type
 * step it wants and the mark follows, sized in `em` off that step.
 *
 * Ink, not accent: the orange means the loop and nothing else, so the logo
 * takes the same colour as the word beside it.
 */
import AppIcon from './AppIcon.vue';
</script>

<template>
  <span class="brand">
    <AppIcon class="brand__mark" name="rewind" />
    <span>Rewindify</span>
  </span>
</template>

<style scoped lang="scss">
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.42em;
  font-weight: 700;
  letter-spacing: -0.018em;
  color: var(--ink);
  cursor: default;
}

/*
 * Overrides the icon's own width/height attributes so one type step drives
 * both halves. Optical, not metric: the triangles read light against a 700
 * weight, so the mark runs a little taller than the cap height.
 */
.brand__mark {
  width: 1.12em;
  height: 1.12em;
}
</style>
