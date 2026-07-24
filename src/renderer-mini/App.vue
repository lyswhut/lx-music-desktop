<template>
  <div :class="$style.container" @mousedown="startDrag">
    <div :class="$style.closeBtn" @click.stop="handleClose" @mouseenter="isCloseHover = true" @mouseleave="isCloseHover = false">
      <svg v-if="isCloseHover" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
        <path d="M18.3 5.71L12 12l-6.3-6.29-1.4 1.41L10.59 13 4.3 19.29l1.4 1.41L12 14.41l6.3 6.29 1.4-1.41L13.41 13l6.29-6.29z" fill="currentColor" />
      </svg>
      <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10">
        <circle cx="12" cy="12" r="5" fill="currentColor" />
      </svg>
    </div>

    <div :class="$style.main">
      <div :class="$style.album">
        <img v-if="musicInfo.pic" :src="musicInfo.pic" @error="handleImgError" />
        <div v-else :class="$style.emptyAlbum">LX</div>
      </div>

      <div :class="$style.info">
        <div :class="$style.title">{{ musicInfo.name || '未播放' }}</div>
        <div :class="$style.singer">{{ musicInfo.singer || '-' }}</div>
        <div :class="$style.lyric">{{ currentLyric || '' }}</div>
      </div>

      <div :class="$style.controls">
        <button :class="[$style.btn]" @click.stop="handlePlayPrev">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" fill="currentColor" />
          </svg>
        </button>
        <button :class="[$style.btn, $style.playBtn]" @click.stop="handleTogglePlay">
          <svg v-if="!isPlay" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
          <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
          </svg>
        </button>
        <button :class="[$style.btn]" @click.stop="handlePlayNext">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>

    <div :class="$style.progress">
      <div :class="$style.progressBar" :style="{ width: progressPercent + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { musicInfo, isPlay, currentLyric, progress } from './store/state'
import { togglePlay, playPrev, playNext } from './core/mainWindowChannel'
import { closeMiniWindow } from './utils/ipc'

const isCloseHover = ref(false)

const progressPercent = computed(() => {
  return progress.value * 100
})

const handleClose = () => {
  void closeMiniWindow()
}

const handleTogglePlay = () => {
  togglePlay()
}

const handlePlayPrev = () => {
  playPrev()
}

const handlePlayNext = () => {
  playNext()
}

const handleImgError = () => {
  musicInfo.pic = null
}

const startDrag = (_e: MouseEvent) => {
  // Dragging is handled by CSS -webkit-app-region: drag
}
</script>

<style lang="less" module>
@color-bg: #1e1e2e;
@color-text: #ffffff;
@color-text-secondary: rgba(255, 255, 255, 0.7);
@color-accent: #10b981;
@color-progress: rgba(16, 185, 129, 0.3);
@color-progress-active: #10b981;

.container {
  width: 100%;
  height: 100%;
  background: @color-bg;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  -webkit-app-region: drag;
  color: @color-text;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

.closeBtn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
  -webkit-app-region: no-drag;
  z-index: 10;

  &:hover {
    background: rgba(239, 68, 68, 0.9);
    color: #ffffff;
  }
}

.main {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.album {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: no-drag;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .emptyAlbum {
    font-size: 20px;
    font-weight: bold;
    color: @color-text-secondary;
  }
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.singer {
  font-size: 12px;
  color: @color-text-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lyric {
  font-size: 12px;
  color: @color-accent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: @color-text;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }

  &.playBtn {
    width: 40px;
    height: 40px;
    background: @color-accent;
    color: #ffffff;

    &:hover {
      background: #059669;
    }
  }
}

.progress {
  height: 3px;
  background: @color-progress;
  position: relative;
  overflow: hidden;
}

.progressBar {
  height: 100%;
  background: @color-progress-active;
  transition: width 0.1s ease;
}
</style>
