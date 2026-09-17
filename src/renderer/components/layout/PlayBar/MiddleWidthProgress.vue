<template>
  <div :class="[$style.player, progressMode == 'mini' ? $style.mini : progressMode == 'full' ? $style.full : null]">
    <div v-if="progressMode == 'full'" :class="$style.hairline">
      <common-progress-bar :class-name="$style.hairlineBar" :progress="progress" :handle-transition-end="handleTransitionEnd" :is-active-transition="isActiveTransition" />
    </div>
    <div :class="$style.now">
      <div :class="$style.picContent" ignore-tip :aria-label="$t('player__pic_tip')" @contextmenu="handleToMusicLocation" @click="showPlayerDetail">
        <img v-if="musicInfo.pic" :src="musicInfo.pic" decoding="async" @error="imgError">
        <div v-else :class="$style.emptyPic">L<span>X</span></div>
      </div>
      <div :class="$style.infoContent">
        <div :class="$style.title" :aria-label="title + $t('copy_tip')" @click="handleCopy(title)">
          {{ title || $t('player__not_playing') }}
        </div>
        <div :class="$style.status">{{ artistLine }}</div>
      </div>
      <button type="button" :class="[$style.loveBtn, 'chrome-ib', { [$style.loved]: isLoved }]" :aria-label="$t('love_list')" :disabled="!musicInfo.id" @click="toggleLove">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <use xlink:href="#icon-line-heart" />
        </svg>
      </button>
    </div>
    <div :class="$style.center">
      <div :class="$style.playBtnContent">
        <button type="button" :class="['chrome-ib', 'sm', 'fill', $style.smallControl, { on: isShuffle }]" :aria-label="$t('player__play_toggle_mode_random')" @click="toggleShuffle">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-list-random" />
          </svg>
        </button>
        <button type="button" class="chrome-ib sm ink" :aria-label="$t('player__prev')" @click="playPrev()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-prev" />
          </svg>
        </button>
        <button type="button" class="chrome-play-main" :aria-label="isPlay ? $t('player__pause') : $t('player__play')" @click="togglePlay">
          <svg v-if="isPlay" viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-pause-fill" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-play-fill" />
          </svg>
        </button>
        <button type="button" class="chrome-ib sm ink" :aria-label="$t('player__next')" @click="playNext()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-next" />
          </svg>
        </button>
        <common-toggle-play-mode-btn />
      </div>
      <div :class="$style.timeContent">
        <span v-if="progressMode != 'full'">{{ nowPlayTimeStr }}</span>
        <div :class="$style.progress">
          <common-progress-bar v-if="progressMode != 'full'" :class-name="$style.progressBar" :progress="progress" :handle-transition-end="handleTransitionEnd" :is-active-transition="isActiveTransition" />
        </div>
        <span v-if="progressMode != 'full'">{{ maxPlayTimeStr }}</span>
      </div>
    </div>
    <div :class="$style.right">
      <control-btns />
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { clipboardWriteText } from '@common/utils/electron'
import ControlBtns from './ControlBtns.vue'
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
import { appSetting, setTogglePlayMode } from '@renderer/store/setting'
import { togglePlay, playNext, playPrev, collectMusic, uncollectMusic } from '@renderer/core/player'
import { checkListExistMusic } from '@renderer/store/list/action'
import { loveList } from '@renderer/store/list/state'
import { LIST_IDS } from '@common/constants'

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

    const title = computed(() => musicInfo.name || '')
    const artistLine = computed(() => {
      if (musicInfo.singer && musicInfo.album) return `${musicInfo.singer} · ${musicInfo.album}`
      return musicInfo.singer || musicInfo.album || statusText.value || window.i18n.t('player__choose_song')
    })
    const progressMode = computed(() => appSetting['common.playBarProgressStyle'] || 'middle')
    const isShuffle = computed(() => appSetting['player.togglePlayMethod'] == 'random')
    const lastPlayMode = ref(appSetting['player.togglePlayMethod'] == 'random' ? 'listLoop' : appSetting['player.togglePlayMethod'])
    const toggleShuffle = () => {
      if (isShuffle.value) {
        setTogglePlayMode(lastPlayMode.value == 'random' ? 'listLoop' : lastPlayMode.value)
        return
      }
      lastPlayMode.value = appSetting['player.togglePlayMethod']
      setTogglePlayMode('random')
    }
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
      artistLine,
      isShuffle,
      toggleShuffle,
      showPlayerDetail,
      isPlay,
      togglePlay,
      playNext,
      playPrev,
      handleToMusicLocation,
      isShowPlayerDetail,
      progressMode,
      isLoved,
      toggleLove,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.player {
  position: relative;
  height: @height-player;
  border-top: 1px solid var(--color-line, var(--color-primary-alpha-900));
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(190px, 1fr) minmax(240px, 1.3fr) minmax(170px, 1fr);
  align-items: center;
  gap: 18px;
  contain: paint;
  padding: 12px 22px;
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
    background-color: var(--color-glass-strong, var(--color-glass, var(--color-main-background)));
    backdrop-filter: blur(22px);
    z-index: -1;
  }
}

.now {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
}

.picContent {
  height: 52px;
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
    box-shadow: 0 1px 4px color-mix(in srgb, var(--color-font) 8%, transparent);
    max-width: 100%;
    max-height: 100%;
    transition: @transition-normal;
    transition-property: border-color;
    border-radius: 7px;
    // border: 2px solid @color-theme_2-background_1;
  }

  .emptyPic {
    background-color: var(--color-well, var(--color-button-background));
    border-radius: 7px;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-muted, var(--color-font-label));
    user-select: none;
    font-size: 20px;
    font-family: Consolas, "Courier New", monospace;

    span {
      padding-left: 3px;
    }
  }
}

.loveBtn {
  &.loved {
    color: var(--color-primary);
    svg {
      fill: currentColor;
    }
  }
}

.infoContent {
  padding: 0;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: flex-start;
  font-size: 13px;
  color: var(--color-font);
  min-width: 0;
  line-height: 1.5;
}

.title {
  max-width: 100%;
  font-size: 12px;
  font-weight: 570;
  color: var(--color-font);
  .mixin-ellipsis-1();
}
.status {
  padding-top: 4px;
  font-size: 10px;
  color: var(--color-secondary, var(--color-font-label));
  .mixin-ellipsis-1();
  max-width: 100%;
}

.center {
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.right {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.timeContent {
  width: 100%;
  color: var(--color-secondary, var(--color-font-label));
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 9px;
}
.progress {
  // position: absolute;
  // top: 0;
  // left: 0;
  // width: 100%;
  flex: auto;
  // width: 160px;
  position: relative;
  // padding-bottom: 6px;
  margin: 0;
  padding: 8px 0;
  :global(.progress),
  .progressBar {
    height: 3px;
  }
  // height: 15px;
  // .progressBar {
  //   height: 4px;
  //   // border-radius: 0;
  // }
}
.time {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}

.playBtnContent {
  height: 31px;
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
  :global(.chrome-ib.ink) {
    svg {
      width: 19px;
      height: 19px;
    }
  }
}

.smallControl {
  svg {
    width: 15px;
    height: 15px;
    fill: currentColor;
    stroke: none;
  }
}

.mini .timeContent {
  max-width: 180px;
}

.hairline {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 8px;
  z-index: 3;
}
.hairlineBar {
  height: 2px;
}

@media (max-width: 1200px) {
  .player {
    padding: 11px 18px;
    gap: 12px;
    grid-template-columns: minmax(145px, 1fr) minmax(215px, 1.3fr) auto;
  }
}

@media (max-width: 960px) {
  .player {
    grid-template-columns: minmax(130px, 1fr) minmax(190px, 1.2fr) auto;
    gap: 12px;
    padding: 12px 17px;
  }
  .picContent {
    height: 43px;
  }
  .loveBtn {
    display: none;
  }
}

</style>
