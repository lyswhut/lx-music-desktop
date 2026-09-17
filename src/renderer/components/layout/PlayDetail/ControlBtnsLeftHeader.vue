<template lang="pug">
div(:class="$style.header")
  div(ref="dom_btns" :class="$style.controBtn")
    button(type="button" :class="$style.hide" :aria-label="$t('player__hide_detail_tip')" ignore-tip @click="hide")
      svg(:class="$style.controBtnIcon" viewBox="0 0 24 24" aria-hidden="true")
        use(xlink:href="#icon-line-down")
    button(type="button" :class="$style.fullscreenExit" :aria-label="$t('fullscreen_exit')" ignore-tip @click="fullscreenExit")
      svg(:class="$style.controBtnIcon" viewBox="0 0 24 24" aria-hidden="true")
        use(xlink:href="#icon-fullscreen-exit")
</template>


<script setup>
import { ref, onMounted, onBeforeUnmount, useCssModule } from '@common/utils/vueTools'
import { isFullscreen } from '@renderer/store'
import { setShowPlayerDetail } from '@renderer/store/player/action'
import { setFullScreen } from '@renderer/utils/ipc'

const dom_btns = ref()

const cssModule = useCssModule()

const handle_focus = () => {
  if (!dom_btns.value) return
  dom_btns.value.classList.remove(cssModule.hover)
}
const handle_mouseenter = () => {
  dom_btns.value.classList.add(cssModule.hover)
}
const handle_mouseleave = () => {
  dom_btns.value.classList.remove(cssModule.hover)
}


onMounted(() => {
  window.app_event.on('focus', handle_focus)
  dom_btns.value.addEventListener('mouseenter', handle_mouseenter)
  dom_btns.value.addEventListener('mouseleave', handle_mouseleave)
})
onBeforeUnmount(() => {
  window.app_event.off('focus', handle_focus)
  dom_btns.value.removeEventListener('mouseenter', handle_mouseenter)
  dom_btns.value.removeEventListener('mouseleave', handle_mouseleave)
})


const hide = () => {
  dom_btns.value?.classList.remove(cssModule.hover)
  setShowPlayerDetail(false)
}
const fullscreenExit = () => {
  dom_btns.value?.classList.remove(cssModule.hover)
  void setFullScreen(false).then((fullscreen) => {
    isFullscreen.value = fullscreen
  })
}


</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@control-btn-width: 12px;

:global(.fullscreen) {
  .header {
    -webkit-app-region: no-drag;
    align-self: flex-start;
    .controBtn {
      .close, .min {
        display: none;
      }
      .fullscreenExit {
        display: flex;
      }
    }
  }
}
.header {
  position: relative;
  flex: 0 0 auto;
  padding: 22px 26px 0;
  -webkit-app-region: drag;
  width: 100%;

  .controBtn {
    position: absolute;
    top: 0;
    display: flex;
    -webkit-app-region: no-drag;

    button {
      display: flex;
      position: relative;
      background: none;
      border: none;
      outline: none;
      padding: 1px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .fullscreenExit {
      display: none;
    }
  }
  .controBtn {
    align-items: center;
    padding: 0;
    left: 26px;
    top: 22px;
    flex-direction: row-reverse;
    gap: 8px;
    height: 32px;
    transition: opacity @transition-normal;
    opacity: 1;
    &.hover {
      opacity: 1;
      .controBtnIcon {
        opacity: 1;
      }
    }

    button {
      width: @control-btn-width;
      height: @control-btn-width;
      border-radius: 50%;
      color: var(--color-font);
      + button {
        margin-right: 0;
      }

      &.hide {
        width: 32px;
        height: 32px;
        background-color: transparent;
        color: var(--color-font-label);
        .controBtnIcon {
          opacity: 1;
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
        }
        &:hover {
          background-color: var(--color-well, var(--color-button-background));
          color: var(--color-primary);
        }
      }
      &.min, &.fullscreenExit {
        background-color: var(--color-btn-min);
      }
      // &.max {
      //   background-color: var(--color-btn-max);
      // }
      &.close {
        background-color: var(--color-btn-close);
      }
    }
  }

  .controBtnIcon {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
}

</style>
