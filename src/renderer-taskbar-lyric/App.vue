<template>
  <div
    class="taskbar-lyric-shell"
    :style="shellStyle"
    :class="{ disabled: !state.enabled, dragging: isDragging, hovering: isHovering }"
    @pointerdown="handlePointerDown"
    @dblclick="handleDoubleClick"
    @contextmenu.prevent="handleContextMenu"
    @pointerenter="handlePointerEnter"
    @pointerleave="handlePointerLeave"
  >
    <div v-if="state.showCover" class="cover">
      <img v-if="state.albumCoverUrl" :src="state.albumCoverUrl" alt="album cover">
      <div v-else class="cover-fallback">LX</div>
    </div>
    <div class="content">
      <template v-if="showActionButtons">
        <div class="action-buttons" @dblclick.stop>
          <button type="button" class="action-button" title="上一首" aria-label="上一首" @pointerdown.stop @click.stop="handleActionClick('prev')">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5.2 4.3a1 1 0 0 1 1 1v9.4a1 1 0 1 1-2 0V5.3a1 1 0 0 1 1-1Zm9.28.58a1 1 0 0 1-.1 1.62L9.6 10l4.78 3.5a1 1 0 0 1-1.18 1.62l-5.86-4.28a1 1 0 0 1 0-1.62l5.86-4.28a1 1 0 0 1 1.28.08Z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            class="action-button action-button-primary"
            :title="state.isPlaying ? '暂停' : '播放'"
            :aria-label="state.isPlaying ? '暂停' : '播放'"
            @pointerdown.stop
            @click.stop="handleActionClick(state.isPlaying ? 'pause' : 'play')"
          >
            <svg v-if="state.isPlaying" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 4.5A1.5 1.5 0 0 1 7.5 6v8A1.5 1.5 0 0 1 6 15.5 1.5 1.5 0 0 1 4.5 14V6A1.5 1.5 0 0 1 6 4.5Zm8 0A1.5 1.5 0 0 1 15.5 6v8A1.5 1.5 0 0 1 14 15.5 1.5 1.5 0 0 1 12.5 14V6A1.5 1.5 0 0 1 14 4.5Z" fill="currentColor" />
            </svg>
            <svg v-else viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.24 4.86c0-.93 1.02-1.5 1.81-1.01l7.12 4.43a2.02 2.02 0 0 1 0 3.44l-7.12 4.43c-.8.49-1.8-.08-1.8-1.01V4.86Z" fill="currentColor" />
            </svg>
          </button>
          <button type="button" class="action-button" title="下一首" aria-label="下一首" @pointerdown.stop @click.stop="handleActionClick('next')">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M14.8 4.3a1 1 0 0 1 1 1v9.4a1 1 0 1 1-2 0V5.3a1 1 0 0 1 1-1Zm-9.28.58a1 1 0 0 1 1.28-.08l5.86 4.28a1 1 0 0 1 0 1.62L6.8 15.12a1 1 0 1 1-1.18-1.62L10.4 10 5.62 6.5a1 1 0 0 1-.1-1.62Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </template>
      <template v-else>
        <div v-if="state.showSongInfo" class="song-info">
          <span class="title">{{ state.title }}</span>
          <span v-if="state.artist" class="separator">-</span>
          <span v-if="state.artist" class="artist">{{ state.artist }}</span>
        </div>
        <p v-if="state.showCurrentLine" class="lyric-line">{{ state.lyricLine || state.artist }}</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { state } from './store/state'
import { computed, onBeforeUnmount, ref } from 'vue'
import { requestTaskbarLyricMenu, requestTaskbarLyricShowMainInterface, sendTaskbarLyricControl, sendTaskbarLyricDragEnd, sendTaskbarLyricDragMove } from './utils/ipc'

interface RGB {
  r: number
  g: number
  b: number
}

const lyricState = state as LX.TaskbarLyric.State
const isDragging = ref(false)
const isHovering = ref(false)
let pointerId: number | null = null
let startScreenX = 0
let startOffsetX = 0

const showActionButtons = computed(() => {
  return isHovering.value && !isDragging.value
})

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
    '--taskbar-lyric-text': toRgbString(primaryText),
    '--taskbar-lyric-text-secondary': toRgbString(secondaryText),
  }
})

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value || event.pointerId !== pointerId) return
  const offsetX = startOffsetX + (event.screenX - startScreenX)
  sendTaskbarLyricDragMove(offsetX)
}

const stopDragging = (event?: PointerEvent) => {
  if (!isDragging.value) return
  if (event && pointerId != null && event.pointerId !== pointerId) return
  isDragging.value = false
  pointerId = null
  sendTaskbarLyricDragEnd()
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopDragging)
  window.removeEventListener('pointercancel', stopDragging)
}

const handlePointerEnter = () => {
  isHovering.value = true
}

const handlePointerLeave = () => {
  isHovering.value = false
}

const handlePointerDown = (event: PointerEvent) => {
  if (event.button !== 0) return
  isDragging.value = true
  pointerId = event.pointerId
  startScreenX = event.screenX
  startOffsetX = state.offsetX
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopDragging)
  window.addEventListener('pointercancel', stopDragging)
}

const handleContextMenu = () => {
  stopDragging()
  requestTaskbarLyricMenu()
}

const handleDoubleClick = () => {
  stopDragging()
  requestTaskbarLyricShowMainInterface()
}

const handleActionClick = (action: 'prev' | 'next' | 'play' | 'pause') => {
  stopDragging()
  sendTaskbarLyricControl(action)
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
  transition: opacity 0.2s ease;
  cursor: grab;

  &.disabled {
    opacity: 0.78;
  }

  &.dragging {
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

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  color: var(--taskbar-lyric-text);
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--taskbar-lyric-text) 12%, transparent);
  }

  &:active {
    transform: scale(0.94);
  }

  svg {
    width: 15px;
    height: 15px;
    display: block;
  }
}

.action-button-primary {
  background: color-mix(in srgb, var(--taskbar-lyric-text) 16%, transparent);
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
