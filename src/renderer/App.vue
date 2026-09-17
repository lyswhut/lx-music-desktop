<template>
    <div id="container" class="view-container" :class="{ 'full-playing': isShowPlayerDetail }">
    <layout-aside id="left" />
    <div id="right">
      <layout-toolbar id="toolbar" />
      <layout-view id="view" />
      <layout-queue-pane />
    </div>
    <layout-play-bar id="player" />
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
// import BubbleCursor from '@common/utils/effects/cursor-effects/bubbleCursor'
// import '@common/utils/effects/snow.min'
import useApp from '@renderer/core/useApp'
import { isShowPlayerDetail } from '@renderer/store/player/state'

useApp()

onMounted(() => {
  document.getElementById('root').style.display = 'block'

  // const styles = getComputedStyle(document.documentElement)
  // window.lxData.bubbleCursor = new BubbleCursor({
  //   fillStyle: styles.getPropertyValue('--color-primary-alpha-900'),
  //   strokeStyle: styles.getPropertyValue('--color-primary-alpha-700'),
  // })
})

// onBeforeUnmount(() => {
//   window.lxData.bubbleCursor?.destroy()
// })

</script>


<style lang="less">
@import './assets/styles/index.less';
@import './assets/styles/layout.less';

html {
  height: 100vh;
}
html, body {
  // overflow: hidden;
  box-sizing: border-box;
}

body {
  user-select: none;
  height: 100%;
  letter-spacing: -0.12px;
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
  // #waiting-mask {
  //   border-radius: @radius-border;
  //   left: @shadow-app;
  //   right: @shadow-app;
  //   top: @shadow-app;
  //   bottom: @shadow-app;
  // }
  #body {
    border-radius: @radius-border;
  }
  #root {
    box-shadow: 0 0 @shadow-app rgba(0, 0, 0, 0.5);
    border-radius: @radius-border;
  }
  // #container {
    // border-radius: @radius-border;
    // background-color: transparent;
  // }
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

  // #view { // 偏移5px距离解决非透明模式下右侧滚动条无法拖动的问题
  //   margin-right: 5Px;
  // }
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
  display: grid;
  grid-template-columns: var(--width-app-left, @width-app-left) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) var(--height-player, @height-player);
  height: 100%;
  background-color: var(--color-app-background);
}

#left {
  grid-column: 1;
  grid-row: 1 / 3;
  min-height: 0;
  width: auto;
  a {
    text-decoration: none;
    &:hover,
    &:focus,
    &:active {
      text-decoration: none;
    }
  }
}
#right {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  transition: background-color @transition-normal;
  background-color: var(--color-main-background);
  overflow: hidden;
}
#player {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
}
#container.full-playing {
  #left {
    grid-row: 1;
  }
  #player {
    grid-column: 1 / -1;
  }
}
#toolbar {
  flex: none;
}
#view {
  position: relative;
  flex: auto;
  min-height: 0;
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

