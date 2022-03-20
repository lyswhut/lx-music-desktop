<template lang="pug">
transition(enter-active-class="animated lightSpeedIn" leave-active-class="animated slideOutDown" @after-enter="handleAfterEnter" @after-leave="handleAfterLeave")
  div(:class="[$style.container, , { [$style.fullscreen]: isFullscreen }]" @contextmenu="handleContextMenu" v-if="isShowPlayerDetail")
    //- div(:class="$style.bg" :style="bgStyle")
    //- div(:class="$style.bg2")
    div(:class="[$style.header, $style.controlBtnLeft]" v-if="setting.controlBtnPosition == 'left'")
      div(:class="$style.controBtn")
        button(type="button" :class="$style.hide" :aria-label="$t('player__hide_detail_tip')" @click="hide")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='80%' viewBox='0 0 30.727 30.727' space='preserve')
            use(xlink:href='#icon-window-hide')
        button(type="button" :class="$style.min" :aria-label="$t('min')" @click="min")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-minimize')

        //- button(type="button" :class="$style.max" @click="max")
        button(type="button" :class="$style.close" :aria-label="$t('close')" @click="close")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-close')
    div(:class="[$style.header, $style.controlBtnRight]" v-else)
      div(:class="$style.controBtn")
        button(type="button" :class="$style.hide" :aria-label="$t('player__hide_detail_tip')" @click="hide")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='35%' viewBox='0 0 30.727 30.727' space='preserve')
            use(xlink:href='#icon-window-hide')
        button(type="button" :class="$style.min" :aria-label="$t('min')" @click="min")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='60%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-minimize-2')

        //- button(type="button" :class="$style.max" @click="max")
        button(type="button" :class="$style.close" :aria-label="$t('close')" @click="close")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='60%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-close-2')

    div(:class="[$style.main, {[$style.showComment]: isShowPlayComment}]")
      div.left(:class="$style.left")
        //- div(:class="$style.info")
        div(:class="$style.info")
          img(:class="$style.img" :src="musicInfo.img" v-if="musicInfo.img")
          div.description(:class="$style.description")
            p {{$t('player__music_name')}}{{musicInfo.name}}
            p {{$t('player__music_singer')}}{{musicInfo.singer}}
            p(v-if="musicInfo.album") {{$t('player__music_album')}}{{musicInfo.album}}

      transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
        LyricPlayer(v-if="visibled")
      music-comment(:class="$style.comment" :musicInfo="musicInfoItem" :show="isShowPlayComment" @close="hideComment" v-if="visibled")
    transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
      play-bar(v-if="visibled")
    transition(enter-active-class="animated-slow fadeIn" leave-active-class="animated-slow fadeOut")
      common-audio-visualizer(v-if="setting.player.audioVisualization && visibled")
</template>


<script>
import { useRefGetter, ref } from '@renderer/utils/vueTools'
import { isFullscreen } from '@renderer/core/share'
import { base as eventBaseName } from '@renderer/event/names'
import {
  isShowPlayerDetail,
  setShowPlayerDetail,
  isShowPlayComment,
  setShowPlayComment,
  setShowPlayLrcSelectContentLrc,
  musicInfoItem,
  musicInfo,
} from '@renderer/core/share/player'
import LyricPlayer from './LyricPlayer'
import PlayBar from './PlayBar'
import MusicComment from './components/MusicComment'

export default {
  name: 'CorePlayDetail',
  components: {
    LyricPlayer,
    PlayBar,
    MusicComment,
  },
  setup() {
    const setting = useRefGetter('setting')
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
      visibled.value = true
    }

    const handleAfterLeave = () => {
      setShowPlayLrcSelectContentLrc(false)
      hideComment(false)
      visibled.value = false
    }

    return {
      setting,
      isShowPlayerDetail,
      isShowPlayComment,
      musicInfoItem,
      musicInfo,
      hide,
      handleContextMenu,
      hideComment,
      handleAfterEnter,
      handleAfterLeave,
      visibled,
      isFullscreen,
      min() {
        window.eventHub.emit(eventBaseName.min)
      },
      max() {
        window.eventHub.emit(eventBaseName.max)
      },
      close() {
        window.eventHub.emit(eventBaseName.close)
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
  background-color: @color-theme_2-background_1;
  z-index: 10;
  // -webkit-app-region: drag;
  overflow: hidden;
  border-radius: @radius-border;
  color: @color-theme_2-font;
  border-left: 12px solid @color-theme;
  -webkit-app-region: no-drag;
  contain: strict;

  box-sizing: border-box;

  * {
    box-sizing: border-box;
  }

  &.fullscreen {
    .header {
      -webkit-app-region: no-drag;
      > * {
        display: none;
      }
    }
  }

}
// .bg {
//   position: absolute;
//   width: 100%;
//   height: 100%;
//   top: 0;
//   left: 0;
//   background-size: 110% 110%;
//   filter: blur(60px);
//   z-index: -1;
// }
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
  }

  &.controlBtnLeft {
    .controBtn {
      align-items: center;
      padding: 0 @control-btn-width;
      left: 0;
      flex-direction: row-reverse;
      height: @height-toolbar * .7;
      &:hover {
        .controBtnIcon {
          opacity: 1;
        }
      }

      button {
        position: relative;
        width: @control-btn-width;
        height: @control-btn-width;
        background: none;
        border: none;
        outline: none;
        padding: 1px;
        cursor: pointer;
        border-radius: 50%;
        color: @color-theme_2;
        display: flex;
        justify-content: center;
        align-items: center;
        + button {
          margin-right: (@control-btn-width / 2);
        }

        &.hide {
          background-color: @color-hideBtn;
        }
        &.min {
          background-color: @color-minBtn;
        }
        &.max {
          background-color: @color-maxBtn;
        }
        &.close {
          background-color: @color-closeBtn;
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
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        width: 46px;
        height: 30px;
        background: none;
        border: none;
        outline: none;
        padding: 1px;
        cursor: pointer;
        color: @color-theme;
        transition: background-color 0.2s ease-in-out;

        &:hover {
          &.hide, &.min, &.max {
            background-color: @color-btn-hover;
          }
          &.close {
            background-color: @color-closeBtn;
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
  transition: flex-basis @transition-theme;
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
  box-shadow: 0 0 4px @color-theme-hover;
  border-radius: 6px;
  opacity: .8;
  // border: 5px solid @color-theme-hover;
  // border-radius: @radius-border;
  // border: 5px solid #fff;
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


each(@themes, {
  :global(#root.@{value}) {
    .container {
      border-left-color: ~'@{color-@{value}-theme}';
      background-color: ~'@{color-@{value}-theme_2-background_1}';
      // color: ~'@{color-@{value}-theme_2-font}';
    }
    .header {
      &.controlBtnLeft {
        .controBtn {
          button {
            color: ~'@{color-@{value}-theme_2}';
            // &.hide:after {
            //   background-color: ~'@{color-@{value}-hideBtn}';
            // }
            &.hide {
              background-color: ~'@{color-@{value}-hideBtn}';
            }
            &.min {
              background-color: ~'@{color-@{value}-minBtn}';
            }
            &.max {
              background-color: ~'@{color-@{value}-maxBtn}';
            }
            &.close {
              background-color: ~'@{color-@{value}-closeBtn}';
            }
          }
        }
      }
      &.controlBtnRight {
        .controBtn {
          button {
            color: ~'@{color-@{value}-theme_2-font-label}';
            &:hover {
              &.hide, &.min, &.max {
                background-color: ~'@{color-@{value}-btn-hover}';
              }
              &.close {
                background-color: ~'@{color-@{value}-closeBtn}';
              }
            }
          }
        }
      }
    }
    .img {
      box-shadow: 0 0 4px ~'@{color-@{value}-theme-hover}';
      // border-color: ~'@{color-@{value}-theme-hover}';
    }
  }
})

</style>
