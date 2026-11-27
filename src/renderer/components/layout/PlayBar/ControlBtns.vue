<template>
  <div :class="$style.controlBtn">
    <button :class="$style.titleBtn" :aria-label="$t('player__locate_music')" @click="locateMusic">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="90%" viewBox="0 0 512 512" space="preserve">
        <use xlink:href="#icon-location" />
      </svg>
    </button>
    <button :class="$style.titleBtn" :aria-label="$t('player__add_music_to')" @click="addMusicTo">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="90%" viewBox="0 0 512 512" space="preserve">
        <use xlink:href="#icon-add-2" />
      </svg>
    </button>
    <button :class="$style.titleBtn" :aria-label="toggleDesktopLyricBtnTitle" @click="toggleDesktopLyric" @contextmenu="toggleLockDesktopLyric">
      <svg v-show="appSetting['desktopLyric.enable']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 512 512" space="preserve">
        <use xlink:href="#icon-desktop-lyric-on" />
      </svg>
      <svg v-show="!appSetting['desktopLyric.enable']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 512 512" space="preserve">
        <use xlink:href="#icon-desktop-lyric-off" />
      </svg>
    </button>
    <common-toggle-play-mode-btn />
    <common-volume-btn />
    <base-slider-bar
      :class="$style.volumeSlider"
      :style="{ '--volume-ratio': volume }"
      :value="volume"
      :min="0"
      :max="1"
      :step="0.01"
      @change="handleUpdateVolume"
      @wheel="handleVolumeWheel"
    />
    <common-list-add-modal v-model:show="isShowAddMusicTo" :music-info="playMusicInfo.musicInfo" />
  </div>
</template>

<script>
import { ref } from '@common/utils/vueTools'
import { useRouter } from '@common/utils/vueRouter'
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
import { musicInfo, playMusicInfo, playInfo } from '@renderer/store/player/state'
import { volume, flashVolumeBubble } from '@renderer/store/player/volume'
import { appSetting } from '@renderer/store/setting'
import { LIST_IDS } from '@common/constants'

export default {
  setup() {
    const router = useRouter()
    const isShowAddMusicTo = ref(false)
    const {
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
    } = useToggleDesktopLyric()
    const addMusicTo = () => {
      if (!musicInfo.id) return
      isShowAddMusicTo.value = true
    }
    const handleUpdateVolume = (val) => {
      window.app_event.setVolume(val)
    }
    const handleVolumeWheel = (event) => {
      window.app_event.setVolume(Math.round(volume.value * 100 + (-event.deltaY / 100 * 2)) / 100)
      flashVolumeBubble()
    }
    const locateMusic = () => {
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
    return {
      appSetting,
      isShowAddMusicTo,
      volume,
      handleUpdateVolume,
      handleVolumeWheel,
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
      addMusicTo,
      locateMusic,
      playMusicInfo,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.controlBtn {
  padding-left: 20px;
  padding-right: 10px;
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  gap: 10px;

  button {
    color: var(--color-button-font);
  }
}

.titleBtn {
  flex: none;
  height: 100%;
  width: 24px;
  transition: @transition-fast;
  transition-property: color, opacity;
  // color: var(--color-button-font);
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border: none;
  width: 24px;
  padding: 0;

  opacity: .6;
  cursor: pointer;

  svg {
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    opacity: 1;
  }
  &:active {
    opacity: 1;
  }
}

.volumeSlider {
  flex: none;
  width: 100px;
  opacity: 1;

  [class*='SliderBar__slider--'] {
    height: 3.5px;
  }

  // 进度条本身是被 scaleX 压出来的，滑块只能按 --volume-ratio 单独定位
  // 描边一圈播放栏底色把滑块从线条里断开，再叠一层投影让它浮起来
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: calc(7.5px + var(--volume-ratio, 0) * (100% - 15px));
    width: 10px;
    height: 10px;
    margin-left: -5px;
    transform: translateY(-50%);
    border-radius: 50%;
    background-color: var(--color-button-font);
    box-shadow:
      0 0 0 2.5px var(--color-main-background),
      0 1px 3px rgba(0, 0, 0, .3);
    transition: left .2s ease;
    pointer-events: none;
  }
}


</style>
