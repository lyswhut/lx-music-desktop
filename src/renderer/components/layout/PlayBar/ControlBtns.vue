<template>
  <div :class="$style.controlBtn">
    <common-volume-bar />
    <div :class="$style.titleBtn" :aria-label="toggleDesktopLyricBtnTitle" @click="toggleDesktopLyric" @contextmenu="toggleLockDesktopLyric">
      <svg v-show="appSetting['desktopLyric.enable']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 512 512" space="preserve">
        <use xlink:href="#icon-desktop-lyric-on" />
      </svg>
      <svg v-show="!appSetting['desktopLyric.enable']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 512 512" space="preserve">
        <use xlink:href="#icon-desktop-lyric-off" />
      </svg>
    </div>
    <div :class="$style.titleBtn" :aria-label="nextTogglePlayName" @click="toggleNextPlayMode">
      <svg v-if="appSetting['player.togglePlayMethod'] == 'listLoop'" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="80%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-list-loop" />
      </svg>
      <svg v-else-if="appSetting['player.togglePlayMethod'] == 'random'" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-list-random" />
      </svg>
      <svg v-else-if="appSetting['player.togglePlayMethod'] == 'list'" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="120%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-list-order" />
      </svg>
      <svg v-else-if="appSetting['player.togglePlayMethod'] == 'singleLoop'" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-single-loop" />
      </svg>
      <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="120%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-single" />
      </svg>
    </div>
    <div :class="$style.titleBtn" :aria-label="$t('player__add_music_to')" @click="addMusicTo">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="80%" viewBox="0 0 512 512" space="preserve">
        <use xlink:href="#icon-add-2" />
      </svg>
    </div>
    <common-list-add-modal v-model:show="isShowAddMusicTo" :music-info="playMusicInfo.musicInfo" />
  </div>
</template>

<script>
import { ref } from '@common/utils/vueTools'
import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
import { appSetting } from '@renderer/store/setting'

export default {
  setup() {
    const isShowAddMusicTo = ref(false)


    const {
      nextTogglePlayName,
      toggleNextPlayMode,
    } = useNextTogglePlay()

    const {
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
    } = useToggleDesktopLyric()


    const addMusicTo = () => {
      if (!musicInfo.id) return
      isShowAddMusicTo.value = true
    }

    return {
      appSetting,
      isShowAddMusicTo,
      nextTogglePlayName,
      toggleNextPlayMode,
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
      addMusicTo,
      playMusicInfo,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.controlBtn {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
}

.titleBtn {
  flex: none;
  margin-left: 5px;
  height: 100%;
  width: 20px;
  color: var(--color-button-font);
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  transition: opacity 0.2s ease;
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


</style>
