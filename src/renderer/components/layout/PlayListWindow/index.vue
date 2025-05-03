<template>
  <div class="playlist-window">
    <button class="close-button" @click="emitClose">✖</button>
    <h2 class="title">播放列表</h2>
    <div class="song-list">
      <div
        v-for="(song, index) in songs"
        :key="index"
        class="song-item"
        :class="[
          { active: currentPlayIndexValue === index },
          { selected: selectedIndex === index || rightClickSelectedIndex === index }
        ]"
        @click="handleListItemClick(index)"
        @contextmenu.prevent="handleListItemRightClick(index, $event)"
      >
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
import { ref, computed, toRef } from 'vue'
import { tempPlayList, currentPlaybackOrder, currentPlayIndex } from '@renderer/store/player/state'

// 为了模板里更方便使用 .value，这里取一个普通变量
const currentPlayIndexValue = toRef(currentPlayIndex, 'value')

const emit = defineEmits(['close'])

// 把 ref 数组转成本地 reactive 引用
const playlist = ref(tempPlayList)

// 计算渲染顺序后的歌曲信息列表
const songs = computed(() => {
  const showlist = []
  for (const idx of currentPlaybackOrder.value) {
    const info = playlist.value[idx]
    if (info && info.musicInfo) {
      showlist.push({
        title: info.musicInfo.name,
        artist: info.musicInfo.singer,
        album: info.musicInfo.meta.albumName,
      })
    }
  }
  return showlist
})

// 本地控制的“选中”索引
const selectedIndex = ref(null)
const rightClickSelectedIndex = ref(null)

// 点击选中
function handleListItemClick(index) {
  selectedIndex.value = index
  // 也可以在这里改变 currentPlayIndex
  currentPlayIndex.value = index
}

// 右键选中
function handleListItemRightClick(index, event) {
  rightClickSelectedIndex.value = index
  // 这里你可以记录 event.clientX/Y 来显示菜单
}

// 关闭按钮
function emitClose() {
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
  display: flex;
  flex-direction: column;
}

/* 关闭按钮 */
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

/* 标题 */
.title {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: white;
}

/* 歌曲列表容器 */
.song-list {
  display: flex;
  flex-direction: column;
}

/* 交替背景：奇数白色，偶数浅灰 */
.song-item:nth-child(2n-1) {
  background-color: #ffffff;
}
.song-item:nth-child(2n) {
  background-color: #f5f5f5; /* 很浅的灰 */
}

/* 通用样式 */
.song-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  transition: background-color 0.2s;
  cursor: pointer;
  color: black; /* 字体统一黑色 */
}

/* hover 状态稍微加深一下 */
.song-item:hover {
  background-color: #eaeaea;
}

/* 当前播放项高亮（深灰） */
.active {
  background-color: #555555 !important;
  color: black !important;
}

/* 选中（左键或右键）状态，更深的灰 */
.selected {
  background-color: #333333 !important;
  color: black !important;
}

/* 序号 */
.song-index {
  width: 24px;
  text-align: right;
  margin-right: 10px;
  color: #666666;
  font-size: 14px;
  flex-shrink: 0;
}

/* 歌曲信息 */
.song-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标题 */
.song-title {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: black;
}

/* 元信息（歌手 · 专辑） */
.song-meta {
  font-size: 12px;
  color: #444444;
  margin-top: 2px;
}
</style>
