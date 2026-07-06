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
    @dragstart.prevent
  >
    <div v-if="state.showCover" class="cover">
      <img v-if="state.albumCoverUrl" :src="state.albumCoverUrl" alt="album cover" draggable="false">
      <div v-else class="cover-fallback">LX</div>
    </div>
    <div class="content">
      <TaskbarLyricActionButtons v-if="showActionButtons" :is-playing="state.isPlaying" @action="handleActionClick" />
      <template v-else>
        <TaskbarLyricSongInfo
          v-if="state.showSongInfo"
          :primary-text="primarySongInfoText"
          :secondary-text="secondarySongInfoText"
          :font-size="state.songInfoFontSize"
        />
        <TaskbarLyricLyricLine
          v-if="state.showCurrentLine"
          :text="displayLyricText"
          :font-size="state.lyricFontSize"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import TaskbarLyricActionButtons from './components/TaskbarLyricActionButtons.vue'
import TaskbarLyricLyricLine from './components/TaskbarLyricLyricLine.vue'
import TaskbarLyricSongInfo from './components/TaskbarLyricSongInfo.vue'
import { useTaskbarLyricShellStyle } from './composables/useTaskbarLyricShellStyle'
import { useTaskbarLyricWindowDrag } from './composables/useTaskbarLyricWindowDrag'
import { state } from './store/state'
import { sendTaskbarLyricControl } from './utils/ipc'

const lyricState = state as LX.TaskbarLyric.State
const { shellStyle } = useTaskbarLyricShellStyle()
const {
  isDragging,
  isHovering,
  handlePointerDown,
  handlePointerEnter,
  handlePointerLeave,
  handleContextMenu,
  handleDoubleClick,
  stopDragging,
} = useTaskbarLyricWindowDrag()

const showActionButtons = computed(() => isHovering.value && !isDragging.value)
const primarySongInfoText = computed(() => lyricState.swapTitleAndArtist && lyricState.artist ? lyricState.artist : lyricState.title)
const secondarySongInfoText = computed(() => lyricState.swapTitleAndArtist ? lyricState.title : lyricState.artist)
const displayLyricText = computed(() => lyricState.lyricLine || lyricState.artist)

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
    user-select: none;
    -webkit-user-drag: none;
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
    display: block;
    width: 15px;
    height: 15px;
  }
}

.action-button-primary {
  background: color-mix(in srgb, var(--taskbar-lyric-text) 16%, transparent);
}

.song-info {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
  overflow: hidden;
  color: var(--taskbar-lyric-text-secondary);
  font-size: var(--taskbar-lyric-song-info-font-size, 11px);
  line-height: 1.1;
  white-space: nowrap;
  opacity: 0.82;
}

.song-info-track {
  display: inline-flex;
  align-items: baseline;
  min-width: max-content;
  animation: taskbar-song-info-marquee var(--taskbar-song-info-scroll-duration, 12s) linear infinite;
  will-change: transform;
}

.song-info-text {
  flex: none;
  color: inherit;
}

.song-info-gap {
  width: 24px;
  flex: none;
}

.song-info-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  color: inherit;
  white-space: nowrap;
}

.title,
.artist,
.lyric-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  color: var(--taskbar-lyric-text-secondary);
  font-weight: 600;
}

.separator,
.artist {
  color: var(--taskbar-lyric-text-secondary);
}

.lyric-line {
  position: relative;
  margin: 0;
  overflow: hidden;
  color: var(--taskbar-lyric-text);
  font-size: var(--taskbar-lyric-line-font-size, 12px);
  line-height: 1.1;
  font-weight: 500;
  white-space: nowrap;
}

.lyric-line-track {
  display: inline-flex;
  align-items: center;
  min-width: max-content;
  animation: taskbar-lyric-marquee var(--taskbar-lyric-line-scroll-duration, 10s) linear infinite;
  will-change: transform;
}

.lyric-line-text {
  flex: none;
}

.lyric-line-gap {
  width: 24px;
  flex: none;
}

.lyric-line-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
}

@keyframes taskbar-lyric-marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(-1 * var(--taskbar-lyric-line-scroll-distance, 0px)));
  }
}

@keyframes taskbar-song-info-marquee {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(calc(-1 * var(--taskbar-song-info-scroll-distance, 0px)));
  }
}
</style>
