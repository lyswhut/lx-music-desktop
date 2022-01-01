<template lang="pug">
#container
  core-aside#left
  #right
    core-toolbar#toolbar
    #view
      core-view#view-container
    core-play-bar#player
  core-icons
  core-version-modal
  core-pact-modal
  core-sync-mode-modal
  core-play-detail
</template>

<script>
import { useRefGetter, watch, onMounted } from '@renderer/utils/vueTools'
import useApp from '@renderer/core/useApp'

export default {
  setup() {
    const theme = useRefGetter('theme')

    const dom_root = document.getElementById('root')

    watch(theme, (val) => {
      dom_root.className = val
    })
    dom_root.className = theme.value

    useApp()

    onMounted(() => {
      // 隐藏等待界面
      /* inited.value = true
      const dom_mask = document.getElementById('waiting-mask')
      if (dom_mask) {
        dom_mask.addEventListener('transitionend', () => {
          dom_mask.parentNode.removeChild(dom_mask)
        })
        dom_mask.classList.add('hide')
      } */
      dom_root.style.display = 'block'
    })
  },
}
</script>


<style lang="less">
@import './assets/styles/index.less';
@import './assets/styles/layout.less';

html, body {
  overflow: hidden;
}

body {
  user-select: none;
  height: 100vh;
  box-sizing: border-box;
}
#root {
  height: 100%;
  position: relative;
  overflow: hidden;
  color: @color-theme_2-font;
  background: @color-theme-bgimg @color-theme-bgposition no-repeat;
  background-size: @color-theme-bgsize;
  transition: background-color @transition-theme;
  background-color: @color-theme;
}

.disableAnimation * {
  transition: none !important;
  animation: none !important;
}

.transparent {
  padding: @shadow-app;
  #waiting-mask {
    border-radius: @radius-border;
    left: @shadow-app;
    right: @shadow-app;
    top: @shadow-app;
    bottom: @shadow-app;
  }
  #root {
    box-shadow: 0 0 @shadow-app rgba(0, 0, 0, 0.5);
    border-radius: @radius-border;
    background-color: transparent;
  }
  #container {
    border-radius: @radius-border;
    background-color: transparent;
  }
}
.disableTransparent {
  background-color: #fff;

  #right {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  #view { // 偏移5px距离解决非透明模式下右侧滚动条无法拖动的问题
    margin-right: 5Px;
  }
}

#container {
  position: relative;
  display: flex;
  height: 100%;
}

#left {
  flex: none;
  width: @width-app-left;
}
#right {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  transition: background-color @transition-theme;
  background-color: @color-theme_2;

  border-top-left-radius: @radius-border;
  border-bottom-left-radius: @radius-border;
  overflow: hidden;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
}
#toolbar, #player {
  flex: none;
}
#view {
  position: relative;
  flex: auto;
  display: flex;
  min-height: 0;
}
#view-container {
  flex: auto;
}

each(@themes, {
  #root.@{value} {
    color: ~'@{color-@{value}-theme_2-font}';
    background-color: ~'@{color-@{value}-theme}';
    background-image: ~'@{color-@{value}-theme-bgimg}';
    background-size: ~'@{color-@{value}-theme-bgsize}';
    background-position: ~'@{color-@{value}-theme-bgposition}';
    #right {
      background-color: ~'@{color-@{value}-theme_2}';
    }
  }
})
</style>

