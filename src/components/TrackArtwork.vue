<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    size: number
    /** Renders the `art` caption used on the now-playing artwork. */
    labelled?: boolean
  }>(),
  { src: undefined, alt: '', labelled: false },
)

/** Larger artwork gets a coarser hatch so the placeholder reads at any size. */
const hatchStep = computed(() => (props.size >= 64 ? 5 : 4))
</script>

<template>
  <div
    class="artwork"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      '--hatch-step': `${hatchStep}px`,
      '--hatch-period': `${hatchStep * 2}px`,
    }"
  >
    <img v-if="src" class="artwork__image" :src="src" :alt="alt" />
    <span v-else-if="labelled" class="artwork__label">art</span>
  </div>
</template>

<style scoped lang="scss">
.artwork {
  position: relative;
  flex: none;
  overflow: hidden;
  border: 1px solid #9a9a9a;
  background: repeating-linear-gradient(
    135deg,
    #ffffff 0 var(--hatch-step),
    #eaeaea var(--hatch-step) var(--hatch-period)
  );
}

.artwork__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork__label {
  position: absolute;
  inset: auto 0 4px;
  text-align: center;
  font-family: ui-monospace, monospace;
  font-size: 7px;
  letter-spacing: 0.1em;
  color: #767676;
  text-transform: uppercase;
}
</style>
