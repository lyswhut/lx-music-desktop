<template>
  <div :class="$style.player">
    <div :class="$style.left" :aria-label="$t('player__pic_tip')" @contextmenu="handleToMusicLocation" @click="showPlayerDetail">
      <img v-if="musicInfo.pic" :src="musicInfo.pic" loading="lazy" decoding="async" @error="imgError">
      <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="102%" width="100%" viewBox="0 0 60 60" space="preserve">
        <use :xlink:href="`#${$style.iconPic}`" />
      </svg>
    </div>
    <div :class="$style.middle">
      <div :class="$style.column1">
        <div :class="$style.container">
          <div :class="$style.title" :aria-label="title + $t('copy_tip')" @click="handleCopy(title)">{{ title }}</div>
          <control-btns />
        </div>
      </div>
      <div :class="$style.column2">
        <common-progress-bar v-if="!isShowPlayerDetail" :progress="progress" :handle-transition-end="handleTransitionEnd" :is-active-transition="isActiveTransition" />
      </div>
      <div :class="$style.column3">
        <template v-if="!isShowPlayerDetail"><span :class="$style.statusText">{{ statusText }}</span><span>{{ nowPlayTimeStr }}</span><span style="margin: 0 5px;">/</span><span>{{ maxPlayTimeStr }}</span></template>
      </div>
    </div>
    <div :class="$style.right">
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
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" style="display: none;">
      <g :id="$style.iconPic">
        <path d="M29,0C12.984,0,0,12.984,0,29c0,16.016,12.984,29,29,29s29-12.984,29-29C58,12.984,45.016,0,29,0zM29,36.08c-3.91,0-7.08-3.17-7.08-7.08c0-3.91,3.17-7.08,7.08-7.08s7.08,3.17,7.08,7.08C36.08,32.91,32.91,36.08,29,36.08z" />
        <path :class="$style.c1" d="M6.487,22.932c-0.077,0-0.156-0.009-0.234-0.027c-0.537-0.13-0.868-0.67-0.739-1.206c0.946-3.935,2.955-7.522,5.809-10.376s6.441-4.862,10.376-5.809c0.536-0.127,1.077,0.202,1.206,0.739c0.129,0.536-0.202,1.076-0.739,1.206c-3.575,0.859-6.836,2.685-9.429,5.277s-4.418,5.854-5.277,9.429C7.349,22.624,6.938,22.932,6.487,22.932z" />
        <path :class="$style.c1" d="M36.066,52.514c-0.451,0-0.861-0.308-0.972-0.767c-0.129-0.536,0.202-1.076,0.739-1.206c3.576-0.859,6.837-2.685,9.43-5.277s4.418-5.854,5.277-9.429c0.129-0.538,0.668-0.868,1.206-0.739c0.537,0.13,0.868,0.67,0.739,1.206c-0.946,3.935-2.955,7.522-5.809,10.376s-6.441,4.862-10.377,5.809C36.223,52.505,36.144,52.514,36.066,52.514z" />
        <path :class="$style.c1" d="M11.313,24.226c-0.075,0-0.151-0.008-0.228-0.026c-0.538-0.125-0.873-0.663-0.747-1.2c0.72-3.09,2.282-5.904,4.52-8.141c2.236-2.237,5.051-3.8,8.141-4.52c0.535-0.131,1.075,0.209,1.2,0.747c0.126,0.537-0.209,1.075-0.747,1.2c-2.725,0.635-5.207,2.014-7.18,3.986s-3.352,4.455-3.986,7.18C12.179,23.914,11.768,24.226,11.313,24.226z" />
        <path :class="$style.c1" d="M34.773,47.688c-0.454,0-0.865-0.312-0.973-0.773c-0.126-0.537,0.209-1.075,0.747-1.2c2.725-0.635,5.207-2.014,7.18-3.986s3.352-4.455,3.986-7.18c0.125-0.538,0.662-0.88,1.2-0.747c0.538,0.125,0.873,0.663,0.747,1.2c-0.72,3.09-2.282,5.904-4.52,8.141c-2.236,2.237-5.051,3.8-8.141,4.52C34.925,47.68,34.849,47.688,34.773,47.688z" />
        <path :class="$style.c1" d="M16.14,25.519c-0.071,0-0.143-0.008-0.215-0.023c-0.539-0.118-0.881-0.651-0.763-1.19c0.997-4.557,4.586-8.146,9.143-9.143c0.537-0.116,1.071,0.222,1.19,0.763c0.118,0.539-0.224,1.072-0.763,1.19c-3.796,0.831-6.786,3.821-7.617,7.617C17.013,25.2,16.6,25.519,16.14,25.519z" />
        <path :class="$style.c1" d="M33.48,42.861c-0.46,0-0.873-0.318-0.976-0.786c-0.118-0.539,0.224-1.072,0.763-1.19c3.796-0.831,6.786-3.821,7.617-7.617c0.118-0.541,0.65-0.881,1.19-0.763c0.539,0.118,0.881,0.651,0.763,1.19c-0.997,4.557-4.586,8.146-9.143,9.143C33.623,42.854,33.552,42.861,33.48,42.861z" />
        <path :class="$style.c2" d="M29,38.08c-5.007,0-9.08-4.073-9.08-9.08s4.073-9.08,9.08-9.08s9.08,4.073,9.08,9.08S34.007,38.08,29,38.08z M29,23.92c-2.801,0-5.08,2.279-5.08,5.08s2.279,5.08,5.08,5.08s5.08-2.279,5.08-5.08S31.801,23.92,29,23.92z" />
      </g>
    </svg>
  </div>
</template>

<script>
import { computed } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import { clipboardWriteText } from '@common/utils/electron'
import ControlBtns from './ControlBtns'
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
  height: @height-player;
  background-color: var(--color-main-background);
  border-top: 1px solid var(--color-primary-alpha-900);
  box-sizing: border-box;
  display: flex;
  contain: strict;
  padding: 5px 0;
  z-index: 2;
  // box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
  * {
    box-sizing: border-box;
  }
}
.left {
  width: @height-player - 2;
  height: 100%;
  // color: var(--color-primary);
  // transition: @transition-normal;
  // transition-property: color;
  flex: none;
  padding: 2PX;
  opacity: 1;
  // transition: @transition-normal;
  // transition-property: opacity;
  display: flex;
  justify-content: center;
  // align-items: center;
  cursor: pointer;

  &:hover {
    opacity: .8;
  }

  svg {
    fill: currentColor;
  }
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
}
.middle {
  flex: auto;
  height: 100%;
  padding: 2px 10px 2px 8px;
  display: flex;
  flex-flow: column nowrap;
}
.right {
  height: 100%;
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding-left: 15px;
  padding-right: 20px;
}
.column1 {
  flex: auto;
  position: relative;
  font-size: 16px;
  .container {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
  }
}

.title {
  flex: 0 1 auto;
  min-width: 0;
  padding-right: 5px;
  font-size: 14px;
  line-height: 18px;
  .mixin-ellipsis-1;
}

.play-btn {
  + .play-btn {
    margin-left: 15px;
  }
  flex: none;
  height: 46%;
  // margin-top: -2px;
  // transition: @transition-normal;
  // transition-property: color;
  color: var(--color-button-font);
  transition: opacity 0.2s ease;
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

.column2 {
  flex: none;
  padding: 3px 0;
  height: 10px;
  position: relative;
}


.column3 {
  transition: @transition-normal;
  transition-property: color;
  color: var(--color-font);
  flex: none;
  font-size: 12px;
  display: flex;
  padding-top: 2px;
  // justify-content: space-between;
  height: 22px;
  align-items: center;
}

.status-text {
  font-size: 0.98em;
  transition: @transition-normal;
  transition-property: color;
  color: var(--color-font-label);
  .mixin-ellipsis-1;
  // padding: 0 5px;
  padding-right: 5px;
  flex: 1 1 0;
  // text-align: center;
  line-height: 1.2;
  width: 0;
}

#icon-pic {
  // color: var(--color-primary);
  .c1 {
    transition: @transition-normal;
    transition-property: fill;
    // fill: @color-player-pic-c1;
  }
  .c2 {
    transition: @transition-normal;
    transition-property: fill;
    // fill: @color-player-pic-c2;
  }
}


</style>
