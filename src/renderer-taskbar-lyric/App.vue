<template>
  <div
    class="taskbar-lyric-shell"
    :style="shellStyle"
    :class="{ disabled: !state.enabled, dragging: isDragging }"
    @pointerdown="handlePointerDown"
    @dblclick="handleDoubleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <div v-if="state.showCover" class="cover">
      <img v-if="state.albumCoverUrl" :src="state.albumCoverUrl" alt="album cover">
      <div v-else class="cover-fallback">LX</div>
    </div>
    <div class="content">
      <div v-if="state.showSongInfo" class="song-info">
        <span class="title">{{ state.title }}</span>
        <span v-if="state.artist" class="separator">-</span>
        <span v-if="state.artist" class="artist">{{ state.artist }}</span>
      </div>
      <p v-if="state.showCurrentLine" class="lyric-line">{{ state.lyricLine || state.artist }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { state } from './store/state'
import { computed, onBeforeUnmount, ref } from 'vue'
import { requestTaskbarLyricMenu, requestTaskbarLyricShowMainInterface, sendTaskbarLyricDragEnd, sendTaskbarLyricDragMove } from './utils/ipc'

interface RGB {
  r: number
  g: number
  b: number
}

const lyricState = state as LX.TaskbarLyric.State
const isDragging = ref(false)
let pointerId: number | null = null
let dragTarget: HTMLElement | null = null
let startScreenX = 0
let startOffsetX = 0

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const parseRgb = (color: string | null | undefined): RGB | null => {
  if (!color) return null
  const value = color.trim()
  if (!value) return null

  const hex = value.replace(/^#/, '')
  if (/^[\da-f]{3}$/i.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    }
  }
  if (/^[\da-f]{6}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }
  const match = value.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i)
  if (!match) return null
  return {
    r: clamp(Math.round(Number(match[1])), 0, 255),
    g: clamp(Math.round(Number(match[2])), 0, 255),
    b: clamp(Math.round(Number(match[3])), 0, 255),
  }
}

const toRgbString = (color: RGB) => `rgb(${color.r}, ${color.g}, ${color.b})`
const withAlpha = (color: RGB, alpha: number) => `rgba(${color.r}, ${color.g}, ${color.b}, ${clamp(alpha, 0, 1)})`

const mix = (colorA: RGB, colorB: RGB, weight: number): RGB => {
  const ratio = clamp(weight, 0, 1)
  const remain = 1 - ratio
  return {
    r: Math.round(colorA.r * remain + colorB.r * ratio),
    g: Math.round(colorA.g * remain + colorB.g * ratio),
    b: Math.round(colorA.b * remain + colorB.b * ratio),
  }
}

const getLuminance = ({ r, g, b }: RGB) => {
  const normalize = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const red = normalize(r)
  const green = normalize(g)
  const blue = normalize(b)
  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

const getContrastRatio = (foreground: RGB, background: RGB) => {
  const [lighter, darker] = [getLuminance(foreground), getLuminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

const getReadableTextColor = (background: RGB) => {
  const lightText = { r: 248, g: 250, b: 252 }
  const darkText = { r: 15, g: 23, b: 42 }
  return getContrastRatio(lightText, background) >= getContrastRatio(darkText, background)
    ? lightText
    : darkText
}

const shellStyle = computed(() => {
  const backgroundOpacity = clamp((lyricState.backgroundOpacity ?? 72) / 100, 0, 1)
  const themeColor = parseRgb(lyricState.themeColor) ?? { r: 77, g: 175, b: 124 }
  const isLightTheme = getLuminance(themeColor) > 0.58
  const isCustomFontMode = lyricState.fontColorMode === 'custom'

  const backgroundBase = lyricState.backgroundColorMode === 'custom'
    ? parseRgb(lyricState.backgroundColor) ?? themeColor
    : isLightTheme
      ? mix(themeColor, { r: 255, g: 255, b: 255 }, 0.82)
      : mix(themeColor, { r: 15, g: 23, b: 42 }, 0.72)

  const backgroundStrong = lyricState.backgroundColorMode === 'custom'
    ? backgroundBase
    : isLightTheme
      ? mix(themeColor, { r: 255, g: 255, b: 255 }, 0.72)
      : mix(themeColor, { r: 30, g: 41, b: 59 }, 0.6)

  const primaryText = isCustomFontMode
    ? parseRgb(lyricState.fontColor) ?? getReadableTextColor(backgroundBase)
    : getReadableTextColor(backgroundBase)

  const secondaryText = isCustomFontMode
    ? primaryText
    : mix(primaryText, backgroundBase, 0.34)
  const borderColor = mix(primaryText, backgroundBase, 0.76)
  const borderOpacity = backgroundOpacity * 0.26

  return {
    '--taskbar-lyric-bg': withAlpha(backgroundBase, backgroundOpacity),
    '--taskbar-lyric-bg-strong': withAlpha(backgroundStrong, backgroundOpacity),
    '--taskbar-lyric-border': withAlpha(borderColor, borderOpacity),
    '--taskbar-lyric-drag-border': withAlpha(primaryText, 0.95),
    '--taskbar-lyric-text': toRgbString(primaryText),
    '--taskbar-lyric-text-secondary': toRgbString(secondaryText),
  }
})

const detachDragListeners = () => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerEnd)
  window.removeEventListener('pointercancel', handlePointerEnd)
  window.removeEventListener('blur', handleWindowBlur)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value || event.pointerId !== pointerId) return
  if ((event.buttons & 1) !== 1) {
    stopDragging()
    return
  }

  const offsetX = startOffsetX + (event.screenX - startScreenX)
  sendTaskbarLyricDragMove(offsetX)
}

const stopDragging = (event?: PointerEvent) => {
  if (!isDragging.value) return
  if (event && pointerId != null && event.pointerId !== pointerId) return
  isDragging.value = false
  if (pointerId != null && dragTarget?.hasPointerCapture(pointerId)) {
    dragTarget.releasePointerCapture(pointerId)
  }
  pointerId = null
  dragTarget = null
  sendTaskbarLyricDragEnd()
  detachDragListeners()
}

const handlePointerEnd = (event: PointerEvent) => {
  stopDragging(event)
}

const handleVisibilityChange = () => {
  if (document.hidden) stopDragging()
}

const handleWindowBlur = () => {
  stopDragging()
}

const handlePointerDown = (event: PointerEvent) => {
  if (event.button !== 0) return
  stopDragging()
  event.preventDefault()
  isDragging.value = true
  pointerId = event.pointerId
  dragTarget = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  dragTarget?.setPointerCapture(pointerId)
  startScreenX = event.screenX
  startOffsetX = state.offsetX
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerEnd)
  window.addEventListener('pointercancel', handlePointerEnd)
  window.addEventListener('blur', handleWindowBlur)
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

const handleContextMenu = () => {
  stopDragging()
  requestTaskbarLyricMenu()
}

const handleDoubleClick = () => {
  stopDragging()
  requestTaskbarLyricShowMainInterface()
}

onBeforeUnmount(() => {
  stopDragging()
})
</script>

<style lang="less">
html,
body,
#root {
  margin: 0;
  width: 100%;
  height: 100%;
}

body {
  overflow: hidden;
  user-select: none;
  color: var(--taskbar-lyric-text, rgb(248, 250, 252));
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
}

* {
  box-sizing: border-box;
}

.taskbar-lyric-shell {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 4px 10px;
  border-radius: 10px;
  background:
    linear-gradient(135deg, var(--taskbar-lyric-bg-strong), var(--taskbar-lyric-bg)),
    var(--taskbar-lyric-bg);
  border: 1px solid var(--taskbar-lyric-border);
  backdrop-filter: blur(10px);
  transition: opacity 0.2s ease, border-color 0.16s ease;
  cursor: grab;

  &.disabled {
    opacity: 0.78;
  }

  &.dragging {
    border-color: var(--taskbar-lyric-drag-border);
    cursor: grabbing;
  }
}

.cover {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(16, 185, 129, 0.86));

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.song-info {
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
  font-size: 12px;
  line-height: 1.1;
}

.title,
.artist,
.lyric-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  color: var(--taskbar-lyric-text);
  font-weight: 700;
}

.separator,
.artist {
  color: var(--taskbar-lyric-text-secondary);
}

.lyric-line {
  margin: 0;
  color: var(--taskbar-lyric-text-secondary);
  font-size: 11px;
  line-height: 1.1;
}
</style>
