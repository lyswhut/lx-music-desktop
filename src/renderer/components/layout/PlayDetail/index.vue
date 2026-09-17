<template lang="pug">
transition(enter-active-class="animated slideInRight" leave-active-class="animated slideOutDown" @after-enter="handleAfterEnter" @after-leave="handleAfterLeave")
  div(v-if="isShowPlayerDetail" :class="[$style.container, { fullscreen: isFullscreen }]" @contextmenu="handleContextMenu")
    div(:class="$style.bg")
    //- div(:class="$style.bg" :style="bgStyle")
    //- div(:class="$style.bg2")
    ControlBtnsLeftHeader(v-if="appSetting['common.controlBtnPosition'] == 'left'")
    ControlBtnsRightHeader(v-else)
    span(:class="$style.eyebrow") {{ playEyebrow }}
    div(:class="$style.nowTools")
      button(type="button" :class="[$style.nowTool, {[$style.on]: appSetting['desktopLyric.enable']}]" :aria-label="toggleDesktopLyricBtnTitle" @click="toggleDesktopLyric" @contextmenu="toggleLockDesktopLyric")
        svg(viewBox="0 0 24 24" aria-hidden="true")
          use(xlink:href="#icon-line-lyric")
      button(type="button" :class="[$style.nowTool, {[$style.on]: isShowPlayComment}]" :aria-label="$t('comment__show')" @click="toggleVisibleComment")
        svg(viewBox="0 0 24 24" aria-hidden="true")
          use(xlink:href="#icon-comment")
      button(type="button" :class="[$style.nowTool, {[$style.on]: isShowLrcSelectContent}]" :aria-label="$t('lyric__select')" @click="toggleVisibleLrc")
        svg(viewBox="0 0 24 24" aria-hidden="true")
          use(xlink:href="#icon-text")
    div(:class="[$style.main, {[$style.showComment]: isShowPlayComment}]")
      div.left(:class="$style.left")
        div(:class="$style.info")
          img(v-if="musicInfo.pic" :class="$style.img" ignore-tip :src="musicInfo.pic")
          h2(:class="$style.nowTitle") {{ musicInfo.name }}
          p(:class="$style.nowMeta") {{ musicInfo.singer }}{{ musicInfo.album ? ' · ' + musicInfo.album : '' }}
          div(:class="$style.nowRow")
            button(type="button" :class="[$style.nowTool, {[$style.on]: isLoved}]" :aria-label="$t('love_list')" :disabled="!musicInfo.id" @click="toggleLove")
              svg(viewBox="0 0 24 24" aria-hidden="true")
                use(xlink:href="#icon-line-heart")

      transition(enter-active-class="animated fadeIn" leave-active-class="animated fadeOut")
        LyricPlayer(v-if="visibled")
      music-comment(v-if="visibled" :class="$style.comment" :show="isShowPlayComment" :music-info="playMusicInfo.musicInfo" @close="hideComment")
    //- 主播放条继续承担传输/进度/音量，详情不再替换三列壳
    transition(enter-active-class="animated-slow fadeIn" leave-active-class="animated-slow fadeOut")
      common-audio-visualizer(v-if="appSetting['player.audioVisualization'] && visibled")
</template>


<script>
import { computed, ref, watch } from '@common/utils/vueTools'
import { collectMusic, uncollectMusic } from '@renderer/core/player'
import { checkListExistMusic } from '@renderer/store/list/action'
import { loveList } from '@renderer/store/list/state'
import { isFullscreen } from '@renderer/store'
import {
  isShowPlayerDetail,
  isShowPlayComment,
  isShowLrcSelectContent,
  musicInfo,
  playMusicInfo,
} from '@renderer/store/player/state'
import {
  setShowPlayerDetail,
  setShowPlayComment,
  setShowPlayLrcSelectContentLrc,
} from '@renderer/store/player/action'
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
import LyricPlayer from './LyricPlayer.vue'
import MusicComment from './components/MusicComment/index.vue'
import ControlBtnsLeftHeader from './ControlBtnsLeftHeader.vue'
import ControlBtnsRightHeader from './ControlBtnsRightHeader.vue'
import { registerAutoHideMounse, unregisterAutoHideMounse } from './autoHideMounse'
import { appSetting } from '@renderer/store/setting'
import { closeWindow, maxWindow, minWindow, setFullScreen } from '@renderer/utils/ipc'

export default {
  name: 'CorePlayDetail',
  components: {
    ControlBtnsLeftHeader,
    ControlBtnsRightHeader,
    LyricPlayer,
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
    const toggleVisibleComment = () => {
      setShowPlayComment(!isShowPlayComment.value)
    }
    const toggleVisibleLrc = () => {
      setShowPlayLrcSelectContentLrc(!isShowLrcSelectContent.value)
    }
    const {
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
    } = useToggleDesktopLyric()

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


    const playEyebrow = computed(() => {
      return musicInfo.album ? `NOW PLAYING  ·  ${musicInfo.album}` : 'NOW PLAYING'
    })
    const isLoved = ref(false)
    const syncLoved = async() => {
      if (!musicInfo.id) {
        isLoved.value = false
        return
      }
      isLoved.value = await checkListExistMusic(loveList.id, musicInfo.id)
    }
    watch(() => musicInfo.id, () => { void syncLoved() }, { immediate: true })
    const toggleLove = () => {
      if (!musicInfo.id) return
      if (isLoved.value) uncollectMusic()
      else collectMusic()
      isLoved.value = !isLoved.value
    }

    return {
      appSetting,
      playMusicInfo,
      isShowPlayerDetail,
      isShowPlayComment,
      isShowLrcSelectContent,
      musicInfo,
      playEyebrow,
      isLoved,
      toggleLove,
      hide,
      handleContextMenu,
      hideComment,
      toggleVisibleComment,
      toggleVisibleLrc,
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
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
  height: auto;
  top: 0;
  bottom: @height-player;
  left: 0;
  background-color: var(--color-content-background);
  z-index: 12;
  // -webkit-app-region: drag;
  overflow: hidden;
  border-radius: 0;
  color: var(--color-font);
  // border-left: 12px solid var(--color-primary-alpha-900);
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
    background-image: radial-gradient(ellipse at 15% 45%, #729a7933, transparent 70%);
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

.nowTools {
  position: absolute;
  top: 22px;
  right: 26px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 5px;
}
.nowTool {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-font-label);
  display: grid;
  place-items: center;
  cursor: pointer;
  svg {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
  }
  &:hover,
  &.on {
    background: var(--color-well, var(--color-button-background));
    color: var(--color-primary);
  }
  &.on {
    background: var(--color-accent-soft, color-mix(in srgb, var(--color-primary) 16%, var(--color-app-background)));
    svg {
      fill: currentColor;
    }
  }
}
.eyebrow {
  position: absolute;
  top: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 2.4px;
  word-spacing: 4px;
  text-transform: uppercase;
  color: var(--color-font-label);
  pointer-events: none;
  white-space: nowrap;
}

.main {
  flex: auto;
  min-height: 0;
  overflow: hidden;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 65px;
  margin: 0;
  padding: 5px 55px 35px;
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
  flex: 0 0 42%;
  max-width: 360px;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
}

.info {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  width: min(100%, 360px);
  max-width: 360px;
  min-height: 0;
}
.img {
  width: 100%;
  max-width: 100%;
  max-height: 80%;
  min-width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  box-shadow: 0 22px 45px rgba(28, 71, 37, 0.17);
  border-radius: 13px;
  opacity: 1;
}
.nowTitle {
  margin: 24px 0 8px;
  font-size: 23px;
  font-weight: 690;
  line-height: 1.25;
  letter-spacing: -0.6px;
}
.nowMeta {
  margin: 0;
  font-size: 12px;
  color: var(--color-secondary);
}
.nowRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}


.comment {
  position: absolute;
  right: 0;
  top: 0;
  width: 350px;
  max-width: 50%;
  height: 100%;
  opacity: 1;
  margin-left: 10px;
  transform: scaleX(0);
}


</style>
