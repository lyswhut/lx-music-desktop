<template lang="pug">
div(:class="$style.container")
  transition(enter-active-class="animated-fast fadeIn" leave-active-class="animated fadeOut")
    div(:class="$style.btns" v-show="!isShowThemeList")
      button(:class="$style.btn" @click="handleClose" :title="$t('desktop_lyric__close')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-close')
      button(:class="$style.btn" @click="handleLock" :title="$t('desktop_lyric__' + (lrcConfig.isLock ? 'unlock' : 'lock'))")
        svg(v-if="config.isLock" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-unlock')
        svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-lock')
      button(:class="$style.btn" :title="$t('desktop_lyric__theme')" @click="isShowThemeList = true")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-theme')
      button(:class="$style.btn" @click="handleFontChange('increase', 10)" @contextmenu="handleFontChange('increase', 1)" :title="$t('desktop_lyric__font_increase')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-font-increase')
      button(:class="$style.btn" @click="handleFontChange('decrease', 10)" @contextmenu="handleFontChange('decrease', 1)" :title="$t('desktop_lyric__font_decrease')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-font-decrease')
      button(:class="$style.btn" @click="handleOpactiyChange('increase', 10)" @contextmenu="handleOpactiyChange('increase', 2)" :title="$t('desktop_lyric__opactiy_increase')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-opactiy-increase')
      button(:class="$style.btn" @click="handleOpactiyChange('decrease', 10)" @contextmenu="handleOpactiyChange('decrease', 2)" :title="$t('desktop_lyric__opactiy_decrease')")
        svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-opactiy-decrease')

      //- button(:class="$style.btn" v-text="lrcConfig.style.isZoomActiveLrc ? '取消缩放' : '缩放歌词'" @click="handleZoomLrc")
      button(:class="$style.btn" @click="handleZoomLrc" :title="$t('desktop_lyric__' + (lrcConfig.style.isZoomActiveLrc ? 'lrc_active_zoom_off' : 'lrc_active_zoom_on'))")
        svg(v-if="config.style.isZoomActiveLrc" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-vibrate-off')
        svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-vibrate')

      button(:class="$style.btn" @click="handleAlwaysOnTop" :title="$t('desktop_lyric__' + (lrcConfig.isAlwaysOnTop ? 'win_top_off' : 'win_top_on'))")
        svg(v-if="config.isAlwaysOnTop" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-top-off')
        svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-top-on')
      //- base-quantity(v-model="config.style.fontSize" :min="30" :step="2" :max="1000" @input="sendEvent")
      //- base-quantity(v-model="config.style.opacity" :min="5" :step="5" :max="100" @input="sendEvent")
  transition(enter-active-class="animated slideInDown" leave-active-class="animated-fast slideOutUp")
    div(:class="$style.themes" v-show="isShowThemeList")
      ul(:class="$style.themeList")
        li(:class="$style.btnBack")
          button(:class="$style.btn" @click="isShowThemeList = false" :title="$t('desktop_lyric__back')")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='20px' viewBox='0 0 512 512' space='preserve')
              use(xlink:href='#icon-back')
        li(:class="[$style.themeItem, theme.className, lrcConfig.theme == theme.id ? $style.active : null]" v-for="theme in themes" @click="handleToggleTheme(theme)")
</template>

<script>
import { rendererSend, rendererOn, NAMES } from '../../../common/ipc'
import { toRaw } from 'vue'

export default {
  props: {
    lrcConfig: {
      type: Object,
      default() {
        return {
          enable: false,
          isLock: false,
          isAlwaysOnTop: false,
          width: 600,
          height: 700,
          x: -1,
          y: -1,
          theme: '',
          style: {
            fontSize: 125,
            opacity: 80,
            isZoomActiveLrc: true,
          },
        }
      },
    },
    themes: {
      type: Array,
      default() {
        return []
      },
    },
  },
  data() {
    return {
      config: {
        enable: false,
        isLock: false,
        isAlwaysOnTop: false,
        theme: 0,
        style: {
          fontSize: 125,
          opacity: 80,
          isZoomActiveLrc: true,
        },
      },
      isShowThemeList: false,
    }
  },
  watch: {
    lrcConfig: {
      handler(n) {
        this.config = JSON.parse(JSON.stringify(n))
      },
    },
  },
  mounted() {
    this.config = JSON.parse(JSON.stringify(this.lrcConfig))
    rendererOn(NAMES.winLyric.key_down, (event, key) => {

    })
  },
  methods: {
    sendEvent() {
      rendererSend(NAMES.winLyric.set_lyric_config, toRaw(this.config))
    },
    handleClose() {
      this.config.enable = false
      this.sendEvent()
    },
    handleLock() {
      this.config.isLock = true
      this.sendEvent()
    },
    handleAlwaysOnTop() {
      this.config.isAlwaysOnTop = !this.config.isAlwaysOnTop
      this.sendEvent()
    },
    handleZoomLrc() {
      this.config.style.isZoomActiveLrc = !this.config.style.isZoomActiveLrc
      this.sendEvent()
    },
    handleFontChange(action, step) {
      let num
      switch (action) {
        case 'increase':
          num = Math.min(this.config.style.fontSize + step, 1000)
          break
        case 'decrease':
          num = Math.max(this.config.style.fontSize - step, 30)
          break
      }
      if (this.config.style.fontSize == num) return
      this.config.style.fontSize = num
      this.sendEvent()
    },
    handleOpactiyChange(action, step) {
      let num
      switch (action) {
        case 'increase':
          num = Math.min(this.config.style.opacity + step, 100)
          break
        case 'decrease':
          num = Math.max(this.config.style.opacity - step, 6)
          break
      }
      if (this.config.style.opacity == num) return
      this.config.style.opacity = num
      this.sendEvent()
    },
    handleToggleTheme(theme) {
      this.config.theme = theme.id
      this.sendEvent()
    },
    // handleUpdateSetting() {
    //   this.sendEvent()
    // },
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
  transition: color @transition-theme;
  &:hover {
    color: @color-theme;
  }
}

.themes {
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);

  &:global(.slideInDown), &:global(.slideOutUp) {
    position: absolute;
    left: 0;
    top: 0;
  }
}

.theme-list {
  display: flex;
  flex-flow: row wrap;
  min-height: @bar-height;
  padding-top: @bar-height-padding;
  padding-left: @bar-height-padding;
  box-sizing: border-box;
}

.btnBack {
  margin-top: -@bar-height-padding;
  margin-left: -@bar-height-padding;
}

.theme-item {
  display: block;
  margin-right: @bar-height-padding;
  width: 24px;
  height: 24px;
  border-radius: @radius-border;
  border: 2px solid transparent;
  box-sizing: border-box;
  padding: 2px;
  cursor: pointer;
  transition: border-color @transition-theme;
  &.active {
    border-color: @color-theme;
  }
  &:after {
    display: block;
    content: ' ';
    width: 100%;
    height: 100%;
    border-radius: @radius-border;
  }
  each(@themes, {
    &:global(.@{value}) {
      &:after {
        background-color: ~'@{color-@{value}-theme}';
      }
    }
  })
}

each(@themes, {
  :global(#container.@{value}) {
    .btn {
      &:hover {
        color: ~'@{color-@{value}-theme}';
      }
    }
    .theme-item {
      &.active {
        border-color: ~'@{color-@{value}-theme}';
      }
    }
  }
})

</style>
