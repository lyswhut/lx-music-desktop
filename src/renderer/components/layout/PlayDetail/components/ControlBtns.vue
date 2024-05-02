<template lang="pug">
div(:class="$style.footerLeftControlBtns")
  button(:class="[$style.footerLeftControlBtn, $style.lrcBtn]" :aria-label="toggleDesktopLyricBtnTitle" @click="toggleDesktopLyric" @contextmenu="toggleLockDesktopLyric")
    svg(v-show="appSetting['desktopLyric.enable']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="125%" viewBox="0 0 512 512" space="preserve")
      use(xlink:href="#icon-desktop-lyric-on")
    svg(v-show="!appSetting['desktopLyric.enable']" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="125%" viewBox="0 0 512 512" space="preserve")
      use(xlink:href="#icon-desktop-lyric-off")
  button(:class="[$style.footerLeftControlBtn, { [$style.active]: appSetting['player.audioVisualization'] }]" :aria-label="$t('audio_visualization')" @click="toggleAudioVisualization")
    svg(version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="95%" viewBox="0 0 24 24" space="preserve")
      use(xlink:href="#icon-audio-wave")
  button(:class="[$style.footerLeftControlBtn, { [$style.active]: isShowLrcSelectContent }]" :aria-label="$t('lyric__select')" @click="toggleVisibleLrc")
    svg(version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="95%" viewBox="0 0 24 24" space="preserve")
      use(xlink:href="#icon-text")
  button(:class="[$style.footerLeftControlBtn, {[$style.active]: isShowPlayComment}]" :aria-label="$t('comment__show')" @click="toggleVisibleComment")
    svg(version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="95%" viewBox="0 0 24 24" space="preserve")
      use(xlink:href="#icon-comment")
  common-sound-effect-btn
  common-playback-rate-btn
  common-volume-btn
  common-toggle-play-mode-btn
  button(:class="$style.footerLeftControlBtn" :aria-label="$t('player__add_music_to')" @click="isShowAddMusicTo = true")
    svg(version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" space="preserve")
      use(xlink:href="#icon-add-2")
  common-list-add-modal(v-model:show="isShowAddMusicTo" :music-info="playMusicInfo.musicInfo")

</template>

<script>
import { ref } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'

import {
  isShowLrcSelectContent,
  isShowPlayComment,
  playMusicInfo,
} from '@renderer/store/player/state'
import {
  setShowPlayLrcSelectContentLrc,
  setShowPlayComment,
} from '@renderer/store/player/action'

import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
import { dialog } from '@renderer/plugins/Dialog'
import { setMediaDeviceId } from '@renderer/plugins/player'
import { appSetting, saveMediaDeviceId, setEnableAudioVisualization } from '@renderer/store/setting'

export default {
  setup() {
    const t = useI18n()
    // const setting = useRefGetter('setting')
    // const setAudioVisualization = useCommit('setAudioVisualization')
    // const saveMediaDeviceId = useCommit('setMediaDeviceId')

    const toggleVisibleLrc = () => {
      setShowPlayLrcSelectContentLrc(!isShowLrcSelectContent.value)
    }
    const toggleVisibleComment = () => {
      setShowPlayComment(!isShowPlayComment.value)
    }
    const {
      nextTogglePlayName,
      toggleNextPlayMode,
    } = useNextTogglePlay()

    const {
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
    } = useToggleDesktopLyric()

    const isShowAddMusicTo = ref(false)

    const toggleAudioVisualization = async() => {
      const newSetting = !appSetting['player.audioVisualization']
      if (newSetting && appSetting['player.mediaDeviceId'] != 'default') {
        const confirm = await dialog.confirm({
          message: t('setting__player_audio_visualization_tip'),
          cancelButtonText: t('cancel_button_text'),
          confirmButtonText: t('confirm_button_text'),
        })
        if (!confirm) return
        await setMediaDeviceId('default').catch(_ => _)
        saveMediaDeviceId('default')
      }
      setEnableAudioVisualization(newSetting)
    }

    return {
      appSetting,
      isShowLrcSelectContent,
      toggleVisibleLrc,
      isShowPlayComment,
      toggleVisibleComment,
      nextTogglePlayName,
      toggleNextPlayMode,
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
      toggleAudioVisualization,
      isShowAddMusicTo,
      playMusicInfo,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.footerLeftControlBtns {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;

  button {
    width: 20px;
    color: var(--color-font);
  }

  .footerLeftControlBtn {
    // width: 18px;
    // height: 18px;
    opacity: .5;
    cursor: pointer;
    transition: opacity @transition-normal;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    padding: 0;

    &:hover {
      opacity: .9;
    }

    &.active {
      color: var(--color-primary);
      opacity: .8;
    }
  }

  .lrcBtn {
    width: 20px;
  }
}

</style>
