<template lang="pug">
transition(enter-active-class="animated slideInRight" leave-active-class="animated slideOutDown" @after-enter="handleAfterEnter" @after-leave="handleAfterLeave")
  div(v-if="isShowPlayerDetail" :class="[$style.container, { [$style.fullscreen]: isFullscreen }]" @contextmenu="handleContextMenu")
    div(:class="$style.bg")
    //- div(:class="$style.bg" :style="bgStyle")
    //- div(:class="$style.bg2")
    div(v-if="appSetting['common.controlBtnPosition'] == 'left'" :class="[$style.header, $style.controlBtnLeft]")
      div(:class="$style.controBtn")
        button(type="button" :class="$style.hide" :aria-label="$t('player__hide_detail_tip')" @click="hide")
          svg(:class="$style.controBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="80%" viewBox="0 0 30.727 30.727" space="preserve")
            use(xlink:href="#icon-window-hide")
        button(type="button" :class="$style.fullscreenExit" :aria-label="$t('fullscreen_exit')" @click="fullscreenExit")
          svg(:class="$style.controBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%")
            use(xlink:href="#icon-fullscreen-exit")
        button(type="button" :class="$style.min" :aria-label="$t('min')" @click="min")
          svg(:class="$style.controBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve")
            use(xlink:href="#icon-window-minimize")

        //- button(type="button" :class="$style.max" @click="max")
        button(type="button" :class="$style.close" :aria-label="$t('close')" @click="close")
          svg(:class="$style.controBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve")
            use(xlink:href="#icon-window-close")
    div(v-else :class="[$style.header, $style.controlBtnRight]")
      div(:class="$style.controBtn")
        button(type="button" :class="$style.hide" :aria-label="$t('player__hide_detail_tip')" @click="hide")
          svg(:class="$style.controBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="35%" viewBox="0 0 30.727 30.727" space="preserve")
            use(xlink:href="#icon-window-hide")
        button(type="button" :class="$style.fullscreenExit" :aria-label="$t('fullscreen_exit')" @click="fullscreenExit")
          svg(:class="$style.controBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%")
            use(xlink:href="#icon-fullscreen-exit")
        button(type="button" :class="$style.min" :aria-label="$t('min')" @click="min")
          svg(:class="$style.controBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%" viewBox="0 0 24 24" space="preserve")
            use(xlink:href="#icon-window-minimize-2")

        //- button(type="button" :class="$style.max" @click="max")
        button(type="button" :class="$style.close" :aria-label="$t('close')" @click="close")
          svg(:class="$style.controBtnIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="60%" viewBox="0 0 24 24" space="preserve")
            use(xlink:href="#icon-window-close-2")
    div(:class="[$style.main, {[$style.showComment]: isShowPlayComment}]")
      div.left(:class="$style.left")
        //- div(:class="$style.info")
        div(:class="$style.info")
          img(v-if="musicInfo.pic" :class="$style.img" :src="musicInfo.pic")
          div.description(:class="$style.description")
            p {{ $t('player__music_name') }}{{ musicInfo.name }}
            p {{ $t('player__music_singer') }}{{ musicInfo.singer }}
            p(v-if="musicInfo.album") {{ $t('player__music_album') }}{{ musicInfo.album }}

      transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
        LyricPlayer(v-if="visibled")
      music-comment(v-if="visibled" :class="$style.comment" :show="isShowPlayComment" :music-info="playMusicInfo.musicInfo" @close="hideComment")
    transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
      play-bar(v-if="visibled")
    transition(enter-active-class="animated-slow fadeIn" leave-active-class="animated-slow fadeOut")
      common-audio-visualizer(v-if="appSetting['player.audioVisualization'] && visibled")
</template>


<script>
import { ref, watch } from '@common/utils/vueTools'
import { isFullscreen } from '@renderer/store'
import {
  isShowPlayerDetail,
  isShowPlayComment,
  musicInfo,
  playMusicInfo,
} from '@renderer/store/player/state'
import {
  setShowPlayerDetail,
  setShowPlayComment,
  setShowPlayLrcSelectContentLrc,
} from '@renderer/store/player/action'
import LyricPlayer from './LyricPlayer.vue'
import PlayBar from './PlayBar.vue'
import MusicComment from './components/MusicComment/index.vue'
import { registerAutoHideMounse, unregisterAutoHideMounse } from './autoHideMounse'
import { appSetting } from '@renderer/store/setting'
import { closeWindow, maxWindow, minWindow, setFullScreen } from '@renderer/utils/ipc'

export default {
  name: 'CorePlayDetail',
  components: {
    LyricPlayer,
    PlayBar,
    MusicComment,
  },
  setup() {
    const visibled = ref(false)

    let clickTime = 0

    const hide = () => {
      setShowPlayerDetail(false)
    }
    const handleContextMenu = () => {
      if (window.performance.now() - clickTime > 400) {
        clickTime = window.performance.now()
        return
      }
      clickTime = 0
      hide()
    }

    const hideComment = () => {
      setShowPlayComment(false)
    }

    const handleAfterEnter = () => {
      if (isFullscreen.value) registerAutoHideMounse()

      visibled.value = true
    }

    const handleAfterLeave = () => {
      setShowPlayLrcSelectContentLrc(false)
      hideComment(false)
      visibled.value = false

      unregisterAutoHideMounse()
    }

    watch(isFullscreen, isFullscreen => {
      (isFullscreen ? registerAutoHideMounse : unregisterAutoHideMounse)()
    })


    return {
      appSetting,
      playMusicInfo,
      isShowPlayerDetail,
      isShowPlayComment,
      musicInfo,
      hide,
      handleContextMenu,
      hideComment,
      handleAfterEnter,
      handleAfterLeave,
      visibled,
      isFullscreen,
      fullscreenExit() {
        void setFullScreen(false).then((fullscreen) => {
          isFullscreen.value = fullscreen
        })
      },
      min() {
        minWindow()
      },
      max() {
        maxWindow()
      },
      close() {
        closeWindow()
      },
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@control-btn-width: @height-toolbar * .26;

.container {
  position: absolute;
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: var(--color-content-background);
  z-index: 10;
  // -webkit-app-region: drag;
  overflow: hidden;
  border-radius: @radius-border;
  color: var(--color-font);
  // border-left: 12px solid var(--color-primary-alpha-900);
  -webkit-app-region: no-drag;
  contain: strict;

  box-sizing: border-box;

  * {
    box-sizing: border-box;
  }

  &.fullscreen {
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

}
.bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: var(--background-image) var(--background-image-position) no-repeat;
  background-size: var(--background-image-size);
  // background-size: 110% 110%;
  // filter: blur(60px);
  opacity: .7;
  z-index: -1;
  &:before {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    background-color: var(--color-app-background);
  }
  &:after {
    position: absolute;
    left: 0;
    top: 0;
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    background-color: var(--color-main-background);
  }
}
// .bg2 {
//   position: absolute;
//   width: 100%;
//   height: 100%;
//   top: 0;
//   left: 0;
//   z-index: -1;
//   background-color: rgba(255, 255, 255, .8);
// }

.header {
  position: relative;
  flex: 0 0 @height-toolbar;
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

  &.controlBtnLeft {
    .controBtn {
      align-items: center;
      padding: 0 @control-btn-width;
      left: 0;
      flex-direction: row-reverse;
      height: @height-toolbar * .7;
      transition: opacity @transition-normal;
      opacity: .5;
      &:hover {
        opacity: .8;
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
          margin-right: (@control-btn-width / 2);
        }

        &.hide {
          background-color: var(--color-btn-hide);
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
  &.controlBtnRight {
    align-self: flex-start;
    .controBtn {
      right: 0;
      button {
        width: 46px;
        height: 30px;
        color: var(--color-font-label);
        transition: background-color 0.2s ease-in-out;

        &:hover {
          background-color: var(--color-button-background-hover);

          &.close {
            background-color: var(--color-btn-close);
          }
        }
      }
    }
  }
}

.main {
  flex: auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  margin: 0 30px;
  position: relative;

  &.showComment {
    :global {
      .left {
        flex-basis: 18%;
        .description p {
          font-size: 12px;
        }
      }
      .right {
        flex-basis: 30%;
        .lyricSelectContent {
          font-size: 14px;
        }
      }
      .comment {
        opacity: 1;
        transform: scaleX(1);
      }
    }
  }
}
.left {
  flex: 0 0 40%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  padding: 13px;
  overflow: hidden;
  transition: flex-basis @transition-normal;
}

.info {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  max-width: 300px;

}
.img {
  max-width: 100%;
  max-height: 100%;
  min-width: 100%;
  box-shadow: 0 0 6px var(--color-primary-alpha-500);
  border-radius: 6px;
  opacity: .8;
}
.description {
  max-width: 300px;
  padding: 15px 0;
  overflow: hidden;
  p {
    line-height: 1.5;
    font-size: 14px;
    overflow-wrap: break-word;
  }
}


.comment {
  position: absolute;
  right: 0;
  top: 0;
  width: 50%;
  height: 100%;
  opacity: 1;
  margin-left: 10px;
  transform: scaleX(0);
}


</style>
