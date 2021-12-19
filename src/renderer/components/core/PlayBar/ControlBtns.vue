<template>
<div :class="$style.controlBtn">
  <common-volume-bar :setting="setting" />
  <div :class="$style.titleBtn" @click="toggleDesktopLyric" @contextmenu="toggleLockDesktopLyric" :tips="toggleDesktopLyricBtnTitle">
    <svg v-show="setting.desktopLyric.enable" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 512 512" space="preserve">
      <use xlink:href="#icon-desktop-lyric-on"></use>
    </svg>
    <svg v-show="!setting.desktopLyric.enable" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 512 512" space="preserve">
      <use xlink:href="#icon-desktop-lyric-off"></use>
    </svg>
  </div>
  <div :class="$style.titleBtn" @click="toggleNextPlayMode" :tips="nextTogglePlayName">
    <svg v-show="setting.player.togglePlayMethod == 'listLoop'" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="80%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-list-loop"></use>
    </svg>
    <svg v-show="setting.player.togglePlayMethod == 'random'" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-list-random"></use>
    </svg>
    <svg v-show="setting.player.togglePlayMethod == 'list'" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="120%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-list-order"></use>
    </svg>
    <svg v-show="setting.player.togglePlayMethod == 'singleLoop'" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-single-loop"></use>
    </svg>
    <svg v-show="!setting.player.togglePlayMethod" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="120%" viewBox="0 0 24 24" space="preserve">
      <use xlink:href="#icon-single"></use>
    </svg>
  </div>
  <div :class="$style.titleBtn" @click="addMusicTo" :tips="$t('player__add_music_to')">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="80%" viewBox="0 0 512 512" space="preserve">
      <use xlink:href="#icon-add-2"></use>
    </svg>
  </div>
  <common-list-add-modal v-model:show="isShowAddMusicTo" :musicInfo="musicInfoItem" />
</div>
</template>

<script>
import { useI18n, ref, useRefGetter } from '@renderer/utils/vueTools'
import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
import { musicInfo, musicInfoItem } from '@renderer/core/share/player'


export default {
  setup() {
    const { t } = useI18n()
    const isShowAddMusicTo = ref(false)

    const setting = useRefGetter('setting')


    const {
      nextTogglePlayName,
      toggleNextPlayMode,
    } = useNextTogglePlay({ setting, t })

    const {
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
    } = useToggleDesktopLyric({ setting, t })


    const addMusicTo = () => {
      if (!musicInfo.songmid) return
      isShowAddMusicTo.value = true
    }

    return {
      setting: setting,
      isShowAddMusicTo,
      nextTogglePlayName,
      toggleNextPlayMode,
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
      addMusicTo,
      musicInfoItem,
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
  color: @color-btn;
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


each(@themes, {
  :global(#root.@{value}) {
    .titleBtn {
      color: ~'@{color-@{value}-btn}';
    }
  }
})

</style>
