<template>
  <div id="container" class="view-container">
    <layout-aside id="left" />
    <div id="right">
      <layout-toolbar id="toolbar" />
      <div class="middle">
        <layout-view id="view" />
        <PlayListWindow v-if="isShowPlaylist" class="playlist-window" @close="closePlaylist()" />
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
import { onMounted } from '@common/utils/vueTools'
import useApp from '@renderer/core/useApp'
import PlayListWindow from '@renderer/components/common/PlayListWindow.vue'
import { isShowPlaylist } from '@renderer/store/player/state'
import { setShowPlaylist } from '@renderer/store/player/action'

const closePlaylist = () => {
  setShowPlaylist(false)
}

useApp()

onMounted(() => {
  document.getElementById('root').style.display = 'block'
})
</script>

<style lang="less">
@import './assets/styles/index.less';
@import './assets/styles/layout.less';

html {
  height: 100vh;
}
html, body {
  box-sizing: border-box;
}
body {
  user-select: none;
  height: 100%;
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
  box-sizing: border-box;
}

.disableAnimation * {
  transition: none !important;
  animation: none !important;
}

.transparent {
  background: transparent;
  padding: @shadow-app;
  #body {
    border-radius: @radius-border;
  }
  #root {
    box-shadow: 0 0 @shadow-app rgba(0, 0, 0, 0.5);
    border-radius: @radius-border;
  }
}
.disableTransparent {
  background-color: var(--color-content-background);

  #body {
    border: 1Px solid var(--color-primary-light-500);
  }

  #right {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}
.fullscreen {
  background-color: var(--color-content-background);

  #right {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
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
  transition: background-color @transition-normal;
  background-color: var(--color-main-background);
  border-top-left-radius: @radius-border;
  border-bottom-left-radius: @radius-border;
  overflow: hidden;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
}

#toolbar,
#player {
  flex: none;
}

/* 中间区域横向布局 */
.middle {
  flex: auto;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* 主内容区域自动伸缩 */
#view {
  position: relative;
  flex: auto;
  min-height: 0;
}

/* 播放列表窗口，默认宽度固定 */
.playlist-window {
  width: 300px;
  flex: none;
  border-left: 1px solid var(--color-border);
  background-color: var(--color-main-background);
}

.view-container {
  transition: opacity @transition-normal;
}
#root.show-modal > .view-container {
  opacity: .9;
}
#view.show-modal > .view-container {
  opacity: .2;
}
</style>
