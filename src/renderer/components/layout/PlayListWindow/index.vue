<template>
  <div class="playlist-window">
      <button class="close-button" @click="emitClose">✖</button>
      <h2 class="title">播放列表</h2>
      <div class="song-list">
        <div v-for="(song, index) in songs" :key="index" class="song-item">
          <div class="song-index">{{ index + 1 }}</div>
          <div class="song-info">
            <div class="song-title">{{ song.title }}</div>
            <div class="song-meta">{{ song.artist }} · {{ song.album }}</div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  // musicInfo,
  // isPlay,
  // playMusicInfo, playInfo,
  tempPlayList,
} from '@renderer/store/player/state'
// import { togglePlay, playNext, playPrev } from '@renderer/core/player'
const emit = defineEmits(['close'])

const playlist = ref(tempPlayList)
const songs = computed(() =>
  playlist.value.map(music => ({
    title: music.musicInfo.name,
    artist: music.musicInfo.singer,
    album: music.musicInfo.meta.albumName,
  })),
)

const emitClose = () => {
  emit('close')
}
</script>

<style scoped>

.playlist-window {
  background-color: #222;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 320px;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}

.title {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  background-color: #2c2c2c;
  transition: background-color 0.2s;
}

.song-item:hover {
  background-color: #3a3a3a;
}

.song-index {
  width: 24px;
  text-align: right;
  margin-right: 10px;
  color: #aaa;
  font-size: 14px;
}

.song-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.song-title {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-meta {
  font-size: 12px;
  color: #888;
}
</style>
