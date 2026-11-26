<template>
  <div :class="$style.player">
    <div :class="$style.progress">
      <common-progress-bar v-if="!isShowPlayerDetail" :class-name="$style.progressBar" :progress="progress" :handle-transition-end="handleTransitionEnd" :is-active-transition="isActiveTransition" />
    </div>
    <div :class="$style.picContent" :aria-label="$t('player__pic_tip')" @contextmenu="handleToMusicLocation" @click="showPlayerDetail">
      <img v-if="musicInfo.pic" :src="musicInfo.pic" decoding="async" @error="imgError">
      <div v-else :class="$style.emptyPic">L<span>X</span></div>
    </div>
    <div :class="$style.infoContent">
      <div :class="$style.title" :aria-label="title + $t('copy_tip')" @click="handleCopy(title)">
        {{ title }}
      </div>
      <div :class="$style.status">{{ playMusicInfo.versionNotice || statusText }}</div>
    </div>
    <div :class="$style.timeContent">
      <span>{{ nowPlayTimeStr }}</span>
      <span style="margin: 0 1px;">/</span>
      <span>{{ maxPlayTimeStr }}</span>
    </div>
    <!-- <play-progress /> -->
    <PlaybackQueue />
    <control-btns />
    <div :class="$style.playBtnContent">
      <div :class="$style.playBtn" :aria-label="$t('player__prev')" @click="playPrev()">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-prevMusic" />
        </svg>
      </div>
      <div :class="[$style.playBtn, $style.playPrimary]" :aria-label="isPlay ? $t('player__pause') : $t('player__play')" @click="togglePlay">
        <svg v-if="isPlay" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-pause" />
        </svg>
        <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-play" />
        </svg>
      </div>
      <div :class="$style.playBtn" :aria-label="$t('player__next')" @click="playNext()">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
          <use xlink:href="#icon-nextMusic" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { clipboardWriteText } from '@common/utils/electron'
import ControlBtns from './ControlBtns.vue'
import PlaybackQueue from './PlaybackQueue.vue'
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
  setShowPlayerDetail,
} from '@renderer/store/player/action'
import { appSetting } from '@renderer/store/setting'
import { togglePlay, playNext, playPrev, handlePlayerPicError } from '@renderer/core/player'
import { LIST_IDS } from '@common/constants'
import { formatMusicName } from '@renderer/utils'

export default {
  name: 'CorePlayBar',
  components: {
    ControlBtns,
    PlaybackQueue,
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
      handlePlayerPicError()
    }

    const handleToMusicLocation = () => {
      const listId = playMusicInfo.listId
      if (!listId || listId == LIST_IDS.DOWNLOAD || !playMusicInfo.musicInfo) return
      if (playInfo.playIndex == -1) return
      void router.push({
        path: '/list',
        query: {
          id: listId,
          scrollIndex: playInfo.playIndex,
        },
      })
    }

    const title = computed(() => {
      return musicInfo.name
        ? formatMusicName(appSetting['download.fileName'], musicInfo.name, musicInfo.singer)
        : ''
    })

    // onBeforeUnmount(() => {
    // window.eventHub.emit(eventPlayerNames.setTogglePlay)
    // })

    return {
      musicInfo,
      playMusicInfo,
      nowPlayTimeStr,
      maxPlayTimeStr,
      progress,
      isActiveTransition,
      handleTransitionEnd,
      handleCopy,
      imgError,
      statusText,
      title,
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
  box-sizing: border-box;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  contain: strict;
  padding: 12px 16px 10px;
  z-index: 2;
  * {
    box-sizing: border-box;
  }

  &:before {
    .mixin-after();
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: var(--color-main-background);
    opacity: .96;
    z-index: -1;
  }
}
.progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding-bottom: 6px;
  .progressBar {
    height: 3px;
    border-radius: 0;
  }
}

.picContent {
  height: 48px;
  width: 48px;
  flex: none;
  opacity: 1;
  transition: transform @transition-fast, opacity @transition-fast;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  &:hover {
    transform: scale(1.03);
    opacity: .92;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    box-shadow: var(--ui-shadow-sm);
    border-radius: var(--ui-radius-sm);
  }

  .emptyPic {
    background-color: var(--ui-surface-active);
    border-radius: var(--ui-radius-sm);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    user-select: none;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.04em;

    span {
      padding-left: 2px;
    }
  }
}

.infoContent {
  padding-left: 14px;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: flex-start;
  color: var(--color-font);
  min-width: 0;
  gap: 2px;
}

.title {
  max-width: 100%;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--color-font);
  cursor: pointer;
  .mixin-ellipsis-1();
  &:hover {
    color: var(--color-primary);
  }
}
.status {
  font-size: 11.5px;
  line-height: 1.35;
  color: var(--color-font-label);
  .mixin-ellipsis-1();
  max-width: 100%;
}

.timeContent {
  flex: none;
  color: var(--color-font-label);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  padding-left: 10px;
}

.playBtnContent {
  height: 100%;
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding-left: 8px;
  gap: 8px;
}

.playBtn {
  flex: none;
  width: 32px;
  height: 32px;
  padding: 7px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color @transition-fast, color @transition-fast, transform 0.12s ease, opacity @transition-fast;
  color: var(--color-font);
  opacity: 0.85;
  cursor: pointer;

  svg {
    fill: currentColor;
  }
  &:hover {
    opacity: 1;
    background-color: var(--ui-surface-hover);
  }
  &:active {
    transform: scale(0.94);
  }
}

.playPrimary {
  width: 38px;
  height: 38px;
  padding: 9px;
  opacity: 1;
  background-color: var(--color-primary);
  color: var(--ui-on-primary, #fff);
  box-shadow: inset 0 0 0 1px var(--ui-border-strong), var(--ui-primary-shadow);

  &:hover {
    background-color: var(--ui-primary-hover-bg, var(--color-primary-dark-100));
    transform: scale(1.04);
  }
  &:active {
    transform: scale(0.95);
  }
}

</style>
