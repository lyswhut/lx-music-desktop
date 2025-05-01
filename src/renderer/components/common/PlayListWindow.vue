<template>
<div class="playlist-overlay">
  <div class="playlist-window">
    <button class="close-button" @click="emitClose">✖</button>
    <h2>播放列表</h2>
    <ul>
      <li v-for="(song, index) in songs" :key="index">
        {{ index + 1 }}. {{ song }}
      </li>
    </ul>
  </div>
</div>
</template>
<script setup>
import { ref } from 'vue'
const emit = defineEmits(['close'])

const songs = ref([
  '海阔天空 - Beyond',
  '夜曲 - 周杰伦',
  '告白气球 - 周杰伦',
  '平凡之路 - 朴树',
])

const emitClose = () => {
  emit('close')
}
</script>
<style scoped>
.playlist-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.playlist-window {
  background-color: #222;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 300px;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
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
</style>
