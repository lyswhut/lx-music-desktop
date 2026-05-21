<template>
  <div
    class="taskbar-lyric-shell"
    :class="{ disabled: !state.enabled, dragging: isDragging }"
    @pointerdown="handlePointerDown"
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
import { onBeforeUnmount, ref } from 'vue'
import { requestTaskbarLyricMenu, sendTaskbarLyricDragEnd, sendTaskbarLyricDragMove } from './utils/ipc'

const isDragging = ref(false)
let pointerId: number | null = null
let startScreenX = 0
let startOffsetX = 0

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
  color: #f5f7fb;
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
    linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(30, 41, 59, 0.7)),
    rgba(15, 23, 42, 0.58);
  border: 1px solid rgba(148, 163, 184, 0.16);
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
  color: #f8fafc;
  font-weight: 700;
}

.separator,
.artist {
  color: rgba(226, 232, 240, 0.66);
}

.lyric-line {
  margin: 0;
  color: rgba(226, 232, 240, 0.94);
  font-size: 11px;
  line-height: 1.1;
}
</style>
