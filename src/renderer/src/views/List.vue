<template>
  <div class="container">
    <div class="list-header">
      <div class="back" @click="handleBackClick">
        <i class="el-icon-arrow-left"></i>
      </div>
      <div class="title" :title="listInfo.name || ''">{{ listInfo.name || '' }}</div>
      <div class="btns">
        <button class="play-btn" @click="handlePlayAll">播放</button>
        <button class="collect-btn" @click="handleCollect">收藏</button>
      </div>
    </div>
    <div class="list-content">
      <!-- list content -->
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      listInfo: {}
    }
  },
  computed: {
    playlistName() {
      return this.listInfo.name || ''
    }
  },
  methods: {
    handleBackClick() {},
    handlePlayAll() {},
    handleCollect() {}
  }
}
</script>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  padding: 10px 20px;
}
.title {
  flex: 1;
  min-width: 0;
  margin: 0 15px;
  font-size: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.back, .btns {
  flex-shrink: 0;
}
</style>