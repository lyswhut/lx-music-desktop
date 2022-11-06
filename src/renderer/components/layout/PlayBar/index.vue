<template>
  <div :class="$style.player">
    <div :class="$style.picContent" :aria-label="$t('player__pic_tip')" @contextmenu="handleToMusicLocation" @click="showPlayerDetail">
      <img v-if="musicInfo.pic" :src="musicInfo.pic" loading="lazy" decoding="async" @error="imgError">
      <div v-else :class="$style.emptyPic">L<span>X</span></div>
    </div>
    <div :class="$style.infoContent">
      <div :class="$style.title" :aria-label=" title + $t('copy_tip')" @click="handleCopy(title)">
        {{ title }}
      </div>
      <div :class="$style.status">{{ statusText }}</div>
    </div>
    <div :class="$style.rightContent">
      <div :class="$style.rightBtn">
        <div :class="$style.playBtnContent">
          <control-btns />
          <div :class="$style.playBtn" :aria-label="$t('player__prev')" style="transform: rotate(180deg);" @click="playPrev()">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 220.847 220.847" space="preserve">
              <use xlink:href="#icon-nextMusic" />
            </svg>
          </div>
          <div :class="$style.playBtn" :aria-label="isPlay ? $t('player__pause') : $t('player__play')" @click="togglePlay">
            <svg v-if="isPlay" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 277.338 277.338" space="preserve">
              <use xlink:href="#icon-pause" />
            </svg>
            <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 170 170" space="preserve">
              <use xlink:href="#icon-play" />
            </svg>
          </div>
          <div :class="$style.playBtn" :aria-label="$t('player__next')" @click="playNext()">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 220.847 220.847" space="preserve">
              <use xlink:href="#icon-nextMusic" />
            </svg>
          </div>
        </div>
      </div>
      <div :class="$style.rightProgress">
        <div :class="$style.timeContent">
          <span>{{ nowPlayTimeStr }}</span>
          <div :class="$style.progress">
            <common-progress-bar v-if="!isShowPlayerDetail" :class-name="$style.progressBar" :progress="progress" :handle-transition-end="handleTransitionEnd" :is-active-transition="isActiveTransition" />
          </div>
          <span>{{ maxPlayTimeStr }}</span>
        </div>
      </div>
    </div>

    <!-- <play-progress /> -->
  </div>
</template>

<script>
import { computed } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { clipboardWriteText } from '@common/utils/electron'
import ControlBtns from './ControlBtns'
// import PlayProgress from './PlayProgress'
import usePlayProgress from '@renderer/utils/compositions/usePlayProgress'
// import { lyric } from '@renderer/core/share/lyric'
import {
  statusText,
  musicInfo,
  isShowPlayerDetail,
  isPlay,
  playInfo,
  playMusicInfo,
} from '@renderer/store/player/state'
import {
  setMusicInfo,
  setShowPlayerDetail,
} from '@renderer/store/player/action'
import { appSetting } from '@renderer/store/setting'
import { togglePlay, playNext, playPrev } from '@renderer/core/player'

export default {
  name: 'CorePlayBar',
  components: {
    ControlBtns,
    // PlayProgress,
  },
  setup() {
    const router = useRouter()

    const {
      nowPlayTimeStr,
      maxPlayTimeStr,
      progress,
      isActiveTransition,
      handleTransitionEnd,
    } = usePlayProgress()

    const showPlayerDetail = () => {
      if (!playMusicInfo.musicInfo) return
      setShowPlayerDetail(true)
    }
    const handleCopy = (text) => {
      clipboardWriteText(text)
    }

    const imgError = () => {
      // console.log(e)
      setMusicInfo({ pic: null })
    }

    const handleToMusicLocation = () => {
      const listId = playMusicInfo.listId
      if (!listId || listId == '__temp__' || listId == 'download' || !playMusicInfo.musicInfo) return
      if (playInfo.playIndex == -1) return
      router.push({
        path: '/list',
        query: {
          id: listId,
          scrollIndex: playInfo.playIndex,
        },
      })
    }

    const title = computed(() => {
      return musicInfo.name
        ? appSetting['download.fileName'].replace('歌名', musicInfo.name).replace('歌手', musicInfo.singer)
        : '^-^'
    })

    const titleName = computed(() => {
      return musicInfo.name
        ? musicInfo.name
        : '^-^'
    })

    const titleSinger = computed(() => {
      return musicInfo.singer
        ? musicInfo.singer
        : '^-^'
    })

    // onBeforeUnmount(() => {
    // window.eventHub.emit(eventPlayerNames.setTogglePlay)
    // })

    return {
      musicInfo,
      nowPlayTimeStr,
      maxPlayTimeStr,
      progress,
      isActiveTransition,
      handleTransitionEnd,
      handleCopy,
      imgError,
      statusText,
      title,
      titleName,
      titleSinger,
      showPlayerDetail,
      isPlay,
      togglePlay,
      playNext,
      playPrev,
      handleToMusicLocation,
      isShowPlayerDetail,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.player {
  position: relative;
  height: @height-player;
  border-top: 1px solid var(--color-primary-alpha-900);
  box-sizing: border-box;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  contain: strict;
  padding: 6px;
  z-index: 2;
  // box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
  * {
    box-sizing: border-box;
  }

  &:before {
    .mixin-after;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: var(--color-main-background);
    opacity: .9;
    z-index: -1;
  }
}

.picContent {
  height: 100%;
  aspect-ratio: 1 / 1;
  // color: var(--color-primary);
  // transition: @transition-normal;
  // transition-property: color;
  flex: none;
  opacity: 1;
  transition: opacity @transition-fast;
  // transition-property: opacity;
  display: flex;
  justify-content: center;
  // align-items: center;
  cursor: pointer;
  &:hover {
    opacity: .8;
  }
  // svg {
  //   fill: currentColor;
  // }
  img {
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
    max-width: 100%;
    max-height: 100%;
    transition: @transition-normal;
    transition-property: border-color;
    // border-radius: 50%;
    border-radius: @radius-border;
    // border: 2px solid @color-theme_2-background_1;
  }

  .emptyPic {
    background-color: var(--color-primary-light-900-alpha-200);
    border-radius: @radius-border;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary-light-400-alpha-200);
    user-select: none;
    font-size: 20px;
    font-family: Consolas, "Courier New", monospace;

    span {
      padding-left: 3px;
    }
  }
}

.timeContent {
  width: 100%;
  // position: relative;
  flex: none;
  color: var(--color-300);
  font-size: 13px;
  padding-top: 8px;
  padding-right: 10px;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
}
.progress {
  // position: absolute;
  flex: auto;
  position: relative;
  margin: 0 8px;
  padding: 8px 0;
}
.time {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}

.infoContent {
  padding-left: 10px;
  flex: auto;
  display: flex;
  margin-right: auto;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: flex-start;
  font-size: 12px;
  color: var(--color-font);
  min-width: 0;
  line-height: 2.2;
  max-width: 40%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.title {
  .mixin-ellipsis-1;
  color: var(--color-font);
  font-size: 14px;
  max-width: 100%;
}
.status {
  .mixin-ellipsis-1;
  color: var(--color-font-lable);
  font-size: 12px;
  max-width: 100%;
}

.rightContent {
  position: absolute;
  height: 100%;
  width: 50%;
  right: 0;
  margin-right: auto;
  padding-right: 10px;
  flex: auto;
  display: flex;
  justify-content: center;
  font-size: 13px;
  color: var(--color-font);
}

.rightBtn {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 8px;
  padding-right: 20px;
  width: 100%;
  height: 50%;
}
.playBtnContent {
  position: absolute;
  justify-content: center;
  align-items: center;
  display: flex;
  height: 100%;
  width: 100%;
  gap: 28px;
}
.play-btn {
  position: relative;
  flex: none;
  height: 90%;
  transition: @transition-fast;
  transition-property: color, opacity;
  color: var(--color-button-font);
  opacity: 1;
  cursor: pointer;
  svg {
    fill: currentColor;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
}

.rightProgress {
  position: absolute;
  right: 0;
  display: inline-block;
  justify-content: center;
  width: 100%;
  height: 50%;
  top: 50%;
  bottom: 0;
  margin-left: auto;
}

</style>
