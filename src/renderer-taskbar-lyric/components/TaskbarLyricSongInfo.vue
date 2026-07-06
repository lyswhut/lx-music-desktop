<template>
  <div ref="containerRef" class="song-info">
    <div
      v-if="shouldScroll"
      class="song-info-track"
      :style="trackStyle"
    >
      <span class="song-info-text">{{ displayText }}</span>
      <span class="song-info-gap" aria-hidden="true"></span>
      <span class="song-info-text" aria-hidden="true">{{ displayText }}</span>
    </div>
    <template v-else>
      <span class="title">{{ primaryText }}</span>
      <span v-if="secondaryText" class="separator">-</span>
      <span v-if="secondaryText" class="artist">{{ secondaryText }}</span>
    </template>
    <span ref="measureRef" class="song-info-measure">{{ displayText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useTaskbarLyricOverflowMarquee } from '../composables/useTaskbarLyricOverflowMarquee'

const props = defineProps<{
  primaryText: string
  secondaryText: string
  fontSize?: number
}>()

const displayText = computed(() => {
  return props.secondaryText ? `${props.primaryText} - ${props.secondaryText}` : props.primaryText
})

const { containerRef, measureRef, shouldScroll, trackStyle } = useTaskbarLyricOverflowMarquee({
  text: displayText,
  minDuration: 10,
  pixelsPerSecond: 26,
  distanceVarName: '--taskbar-song-info-scroll-distance',
  durationVarName: '--taskbar-song-info-scroll-duration',
  watchSources: [toRef(props, 'fontSize')],
})
</script>
