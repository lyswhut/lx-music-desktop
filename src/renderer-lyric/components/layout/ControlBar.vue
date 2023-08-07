<template>
  <div :class="$style.container">
    <transition enter-active-class="animated-fast fadeIn" leave-active-class="animated fadeOut">
      <div v-show="!isShowThemeList" :class="$style.btns">
        <button :class="$style.btn" :title="$t('desktop_lyric__close')" @click="handleClose">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-close" />
          </svg>
        </button>
        <button :class="$style.btn" :title="$t('desktop_lyric__' + (setting['desktopLyric.isLock'] ? 'unlock' : 'lock'))" @click="handleLock">
          <svg v-if="setting['desktopLyric.isLock']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-unlock" />
          </svg>
          <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-lock" />
          </svg>
        </button>
        <button :class="$style.btn" :title="$t('desktop_lyric__font_increase')" @click="handleFontChange('increase', 1)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-font-increase" />
          </svg>
        </button>
        <button :class="$style.btn" :title="$t('desktop_lyric__font_decrease')" @click="handleFontChange('decrease', 1)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-font-decrease" />
          </svg>
        </button>
        <button :class="$style.btn" :title="$t('desktop_lyric__opactiy_increase')" @click="handleOpactiyChange('increase', 10)" @contextmenu="handleOpactiyChange('increase', 2)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-opactiy-increase" />
          </svg>
        </button>
        <button :class="$style.btn" :title="$t('desktop_lyric__opactiy_decrease')" @click="handleOpactiyChange('decrease', 10)" @contextmenu="handleOpactiyChange('decrease', 2)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-opactiy-decrease" />
          </svg>
        </button>
        <button :class="$style.btn" :title="$t('desktop_lyric__' + (setting['desktopLyric.style.isZoomActiveLrc'] ? 'lrc_active_zoom_off' : 'lrc_active_zoom_on'))" @click="handleZoomLrc">
          <svg v-if="setting['desktopLyric.style.isZoomActiveLrc']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-vibrate-off" />
          </svg>
          <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-vibrate" />
          </svg>
        </button>
        <button :class="$style.btn" :title="$t('desktop_lyric__' + (setting['desktopLyric.isAlwaysOnTop'] ? 'win_top_off' : 'win_top_on'))" @click="handleAlwaysOnTop">
          <svg v-if="setting['desktopLyric.isAlwaysOnTop']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-top-off" />
          </svg>
          <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="20px" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-top-on" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref } from '@common/utils/vueTools'
import { setting } from '@lyric/store/state'
import { updateSetting } from '@lyric/store/action'

export default {
  setup() {
    const isShowThemeList = ref(false)

    const handleClose = () => {
      updateSetting({ 'desktopLyric.enable': false })
    }
    const handleLock = () => {
      updateSetting({ 'desktopLyric.isLock': true })
    }
    const handleAlwaysOnTop = () => {
      updateSetting({ 'desktopLyric.isAlwaysOnTop': !setting['desktopLyric.isAlwaysOnTop'] })
    }
    const handleZoomLrc = () => {
      updateSetting({ 'desktopLyric.style.isZoomActiveLrc': !setting['desktopLyric.style.isZoomActiveLrc'] })
    }
    const handleFontChange = (action, step) => {
      let num
      switch (action) {
        case 'increase':
          num = Math.min(setting['desktopLyric.style.fontSize'] + step, 80)
          break
        case 'decrease':
          num = Math.max(setting['desktopLyric.style.fontSize'] - step, 10)
          break
      }
      if (setting['desktopLyric.style.fontSize'] == num) return
      updateSetting({ 'desktopLyric.style.fontSize': num })
    }
    const handleOpactiyChange = (action, step) => {
      let num
      switch (action) {
        case 'increase':
          num = Math.min(setting['desktopLyric.style.opacity'] + step, 100)
          break
        case 'decrease':
          num = Math.max(setting['desktopLyric.style.opacity'] - step, 6)
          break
      }
      if (setting['desktopLyric.style.opacity'] == num) return
      updateSetting({ 'desktopLyric.style.opacity': num })
    }
    return {
      setting,
      isShowThemeList,

      handleClose,
      handleLock,
      handleAlwaysOnTop,
      handleZoomLrc,
      handleFontChange,
      handleOpactiyChange,
    }
  },
}
</script>

<style lang="less" module>
@import '../../assets/styles/layout.less';

@bar-height: 38px;
@bar-height-padding: 7px;

.container {
  position: relative;
  // height: 50px;
  transition: opacity @transition-theme;
  // opacity: 0;
  // &:hover {
  //   opacity: 1;
  // }
}

.btns {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
}

.btn {
  min-height: @bar-height;
  padding: 0 10px;
  cursor: pointer;
  border: none;
  outline: none;
  background: none;
  color: #fff;
  transition: opacity @transition-theme;
  &:hover {
    opacity: .7;
  }
}

</style>
