<template lang="pug">
transition(enter-active-class="animated lightSpeedIn" leave-active-class="animated slideOutDown" @after-enter="handleAfterEnter" @after-leave="handleAfterLeave")
  div(:class="$style.container" @contextmenu="handleContextMenu" v-if="isShowPlayerDetail")
    //- div(:class="$style.bg" :style="bgStyle")
    //- div(:class="$style.bg2")
    div(:class="[$style.header, $style.controlBtnLeft]" v-if="setting.controlBtnPosition == 'left'")
      div(:class="$style.controBtn")
        button(type="button" :class="$style.hide" :tips="$t('player__hide_detail_tip')" @click="hide")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='80%' viewBox='0 0 30.727 30.727' space='preserve')
            use(xlink:href='#icon-window-hide')
        button(type="button" :class="$style.min" :tips="$t('min')" @click="min")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-minimize')

        //- button(type="button" :class="$style.max" @click="max")
        button(type="button" :class="$style.close" :tips="$t('close')" @click="close")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-close')
    div(:class="[$style.header, $style.controlBtnRight]" v-else)
      div(:class="$style.controBtn")
        button(type="button" :class="$style.hide" :tips="$t('player__hide_detail_tip')" @click="hide")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='35%' viewBox='0 0 30.727 30.727' space='preserve')
            use(xlink:href='#icon-window-hide')
        button(type="button" :class="$style.min" :tips="$t('min')" @click="min")
          svg(:class="$style.controBtnIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='60%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-window-minimize-2')

        //- button(type="button" :class="$style.max" @click="max")
        button(type="button" :class="$style.close" :tips="$t('close')" @click="close")
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

}
.bg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-size: 110% 110%;
  filter: blur(60px);
  z-index: -1;
}
.bg2 {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
  background-color: rgba(255, 255, 255, .8);
}

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
        .lyric {
          font-size: 13px;
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

.right {
  flex: 0 0 60%;
  // padding: 0 30px;
  position: relative;
  transition: flex-basis @transition-theme;

  &:before {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    content: ' ';
    height: 100px;
    width: 100%;
    background-image: linear-gradient(0deg,rgba(255,255,255,0) 0%,@color-theme_2-background_1 95%);
    pointer-events: none;
  }
  &:after {
    position: absolute;
    bottom: 0;
    left: 0;
    content: ' ';
    height: 100px;
    width: 100%;
    background-image: linear-gradient(-180deg,rgba(255,255,255,0) 0%,@color-theme_2-background_1 95%);
    pointer-events: none;
  }
}
.lyric {
  text-align: center;
  height: 100%;
  overflow: hidden;
  font-size: 16px;
  cursor: grab;
  &.draging {
    cursor: grabbing;
  }
  :global {
    .lrc-content {
      line-height: 1.2;
      margin: 16px 0;
      overflow-wrap: break-word;
      color: @color-player-detail-lyric;

      .translation {
        transition: @transition-theme !important;
        transition-property: font-size, color;
        font-size: .9em;
        margin-top: 5px;
      }
      .line {
        transition-property: font-size, color !important;
        background: none !important;
        -webkit-text-fill-color: unset;
        // -webkit-text-fill-color: none !important;
      }
      &.active {
        .line {
          color: @color-theme;
        }
        .translation {
          font-size: 1em;
          color: @color-theme;
        }
        span {
          // color: @color-theme;
          font-size: 1.2em;
        }
      }

      span {
        transition: @transition-theme !important;
        transition-property: font-size !important;
        font-size: 1em;
        background-repeat: no-repeat;
        background-color: rgba(77, 77, 77, 0.9);
        background-image: -webkit-linear-gradient(top, @color-theme, @color-theme);
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        background-size: 0 100%;
      }
    }
  }
  // p {
  //   padding: 8px 0;
  //   line-height: 1.2;
  //   overflow-wrap: break-word;
  //   transition: @transition-theme !important;
  //   transition-property: color, font-size;
  // }
  // .lrc-active {
  //   color: @color-theme;
  //   font-size: 1.2em;
  // }
}
.lyricSelectContent {
  position: absolute;
  left: 0;
  top: 0;
  // text-align: center;
  height: 100%;
  width: 100%;
  font-size: 16px;
  background-color: @color-theme_2-background_1;
  z-index: 10;
  color: @color-player-detail-lyric;

  .lyricSelectline {
    padding: 8px 0;
    overflow-wrap: break-word;
    transition: @transition-theme !important;
    transition-property: color, font-size;
    line-height: 1.3;
  }
  .lyricSelectlineTransition {
    font-size: 14px;
  }
  .lrc-active {
    color: @color-theme;
  }
}

.lyric-space {
  height: 70%;
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
    .right {
      &:before {
        background-image: linear-gradient(0deg,rgba(255,255,255,0) 0%,~'@{color-@{value}-theme_2-background_1}' 95%);
      }
      &:after {
        background-image: linear-gradient(-180deg,rgba(255,255,255,0) 0%,~'@{color-@{value}-theme_2-background_1}' 95%);
      }
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
    .lyric {
      :global {
        .lrc-content {
          color: ~'@{color-@{value}-player-detail-lyric}';

          &.active {
            .translation {
              color: ~'@{color-@{value}-player-detail-lyric-active}';
            }
            .line {
              color: ~'@{color-@{value}-player-detail-lyric-active}';
            }
          }
          span {
            background-color: ~'@{color-@{value}-player-detail-lyric}';
            background-image: -webkit-linear-gradient(top, ~'@{color-@{value}-player-detail-lyric-active}', ~'@{color-@{value}-player-detail-lyric-active}');
          }
        }
      }
    }
    // .lrc-active {
    //   color: ~'@{color-@{value}-theme}';
    // }
    .lyricSelectContent {
      background-color: ~'@{color-@{value}-theme_2-background_1}';
      color: ~'@{color-@{value}-player-detail-lyric}';
      .lrc-active {
        color: ~'@{color-@{value}-theme}';
      }
    }
    .footerLeftControlBtns {
      color: ~'@{color-@{value}-theme_2-font}';
    }
    .footerLeftControlBtn {
      &.active {
        color: ~'@{color-@{value}-theme}';
      }
    }
    .progress {
      background-color: ~'@{color-@{value}-player-progress}';
    }
    .progress-bar1 {
      background-color: ~'@{color-@{value}-player-progress-bar1}';
    }
    .progress-bar2 {
      background-color: ~'@{color-@{value}-player-progress-bar2}';
    }
    .play-btn {
      color: ~'@{color-@{value}-player-detail-play-btn}';
    }
  }
})

</style>
