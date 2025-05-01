<template>
<button class="playlist-button" @click="togglePlaylist">
  🎵 播放列表
</button>
</template>
<script setup>
import { isShowPlaylist } from '@renderer/store/player/state'
import { setShowPlaylist } from '@renderer/store/player/action'
const togglePlaylist = () => {
  setShowPlaylist(!isShowPlaylist.value)
}
</script>
<style scoped>
.playlist-button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}
.playlist-button:hover {
  background-color: #45a049;
}
</style>
