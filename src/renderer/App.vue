<template>
  <div id="container" class="view-container">
    <layout-aside id="left" />
    <div id="right">
      <layout-toolbar id="toolbar" />
      <div class="middle">
        <layout-view id="view" ref="viewRef" />
        <PlayListWindow
          v-if="isShowPlaylist"
          :style="playlistStyle"
          @close="closePlaylist"
        />
      </div>
      <layout-play-bar id="player" />
    </div>

    <layout-icons />
    <layout-change-log-modal />
    <layout-update-modal />
    <layout-pact-modal />
    <layout-sync-mode-modal />
    <layout-sync-auth-code-modal />
    <layout-play-detail />
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, computed } from '@common/utils/vueTools'
import useApp from '@renderer/core/useApp'
import PlayListWindow from '@renderer/components/common/PlayListWindow.vue'
import { isShowPlaylist } from '@renderer/store/player/state'
import { setShowPlaylist } from '@renderer/store/player/action'

const viewRef = ref(null)

const playlistStyle = computed(() => {
  const el = viewRef.value?.$el || viewRef.value
  if (!el) return {}
  const rect = el.getBoundingClientRect()
  return {
    position: 'absolute',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    height: `${rect.height}px`,
    width: `${rect.width}px`,
    zIndex: 1000,
  }
})

const closePlaylist = () => {
  setShowPlaylist(false)
}

useApp()

onMounted(async () => {
  document.getElementById('root').style.display = 'block'
  await nextTick()
})
</script>

<style lang="less">
@import './assets/styles/index.less';
@import './assets/styles/layout.less';

html, body {
  height: 100%;
  box-sizing: border-box;
  user-select: none;
}
#root {
  height: 100%;
  position: relative;
  overflow: hidden;
  color: var(--color-font);
  background: var(--background-image) var(--background-image-position) no-repeat;
  background-size: var(--background-image-size);
  transition: background-color @transition-normal;
  background-color: var(--color-content-background);
}

#container {
  position: relative;
  display: flex;
  height: 100%;
  background-color: var(--color-app-background);
}

#left {
  flex: none;
  width: @width-app-left;
}

#right {
  flex: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--color-main-background);
  border-top-left-radius: @radius-border;
  border-bottom-left-radius: @radius-border;
}

.middle {
  flex: auto;
  display: flex;
  position: relative;
  min-height: 0;
}

#view {
  position: relative;
  flex: auto;
  min-height: 0;
}

.playlist-window {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-left: 1px solid var(--color-border);
  background-color: var(--color-main-background);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  border-radius: @radius-border;
  overflow: hidden;
  z-index: 1000;
}
</style>
