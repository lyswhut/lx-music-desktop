<template>
  <div ref="containerRef" class="lyric-line">
    <div
      v-if="shouldScroll"
      class="lyric-line-track"
      :style="trackStyle"
    >
      <span class="lyric-line-text">{{ text }}</span>
      <span class="lyric-line-gap" aria-hidden="true"></span>
      <span class="lyric-line-text" aria-hidden="true">{{ text }}</span>
    </div>
    <span v-else class="lyric-line-text">{{ text }}</span>
    <span ref="measureRef" class="lyric-line-measure">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useTaskbarLyricOverflowMarquee } from '../composables/useTaskbarLyricOverflowMarquee'

const props = defineProps<{
  text: string
  fontSize?: number
}>()

const { containerRef, measureRef, shouldScroll, trackStyle } = useTaskbarLyricOverflowMarquee({
  text: toRef(props, 'text'),
  minDuration: 8,
  pixelsPerSecond: 28,
  distanceVarName: '--taskbar-lyric-line-scroll-distance',
  durationVarName: '--taskbar-lyric-line-scroll-duration',
  watchSources: [toRef(props, 'fontSize')],
})
</script>
