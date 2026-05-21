<template>
  <div class="taskbar-lyric-shell" :class="{ disabled: !state.enabled, playing: state.isPlaying }">
    <div v-if="state.showCover" class="cover">
      <img v-if="state.albumCoverUrl" :src="state.albumCoverUrl" alt="album cover">
      <div v-else class="cover-fallback">LX</div>
    </div>
    <div class="content">
      <div class="meta-row">
        <div v-if="state.showSongInfo" class="song-info">
          <span class="title">{{ state.title }}</span>
          <span class="separator">/</span>
          <span class="artist">{{ state.artist }}</span>
        </div>
        <span class="status">{{ state.isPlaying ? 'Playing' : 'Standby' }}</span>
      </div>
      <p v-if="state.showCurrentLine" class="lyric-line">{{ state.lyricLine }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { state } from './store/state'
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
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 8px 14px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.72)),
    rgba(15, 23, 42, 0.64);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(14px);
  transition: opacity 0.2s ease, transform 0.2s ease;

  &.disabled {
    opacity: 0.78;
  }

  &.playing {
    .status {
      color: #34d399;
      background-color: rgba(52, 211, 153, 0.14);
    }
  }
}

.cover {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(16, 185, 129, 0.86));
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.32);

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
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.song-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
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
  color: rgba(226, 232, 240, 0.7);
}

.status {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fbbf24;
  background-color: rgba(251, 191, 36, 0.12);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lyric-line {
  margin: 0;
  color: rgba(226, 232, 240, 0.94);
  font-size: 12px;
  line-height: 1.3;
}
</style>
