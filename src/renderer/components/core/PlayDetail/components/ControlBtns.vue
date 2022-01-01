<template lang="pug">
div(:class="$style.footerLeftControlBtns")
  common-volume-bar(:setting="setting")
  div(:class="[$style.footerLeftControlBtn, $style.lrcBtn]" @click="toggleDesktopLyric" @contextmenu="toggleLockDesktopLyric" :tips="toggleDesktopLyricBtnTitle")
    svg(v-show="setting.desktopLyric.enable" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='125%' viewBox='0 0 512 512' space='preserve')
      use(xlink:href='#icon-desktop-lyric-on')
    svg(v-show="!setting.desktopLyric.enable" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='125%' viewBox='0 0 512 512' space='preserve')
      use(xlink:href='#icon-desktop-lyric-off')
  div(:class="[$style.footerLeftControlBtn, { [$style.active]: setting.player.audioVisualization }]" @click="toggleAudioVisualization" :tips="$t('audio_visualization')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='95%' viewBox='0 0 24 24' space='preserve')
      use(xlink:href='#icon-audio-wave')
  div(:class="[$style.footerLeftControlBtn, { [$style.active]: isShowLrcSelectContent }]" @click="toggleVisibleLrc" :tips="$t('lyric__select')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='95%' viewBox='0 0 24 24' space='preserve')
      use(xlink:href='#icon-text')
  div(:class="[$style.footerLeftControlBtn, {[$style.active]: isShowPlayComment}]" @click="toggleVisibleComment" :tips="$t('comment__show')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='95%' viewBox='0 0 24 24' space='preserve')
      use(xlink:href='#icon-comment')
  div(:class="$style.footerLeftControlBtn" @click="toggleNextPlayMode" :tips="nextTogglePlayName")
    svg(v-show="setting.player.togglePlayMethod == 'listLoop'" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 24 24' space='preserve')
      use(xlink:href='#icon-list-loop')
    svg(v-show="setting.player.togglePlayMethod == 'random'" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 24 24' space='preserve')
      use(xlink:href='#icon-list-random')
    svg(v-show="setting.player.togglePlayMethod == 'list'" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='120%' viewBox='0 0 24 24' space='preserve')
      use(xlink:href='#icon-list-order')
    svg(v-show="setting.player.togglePlayMethod == 'singleLoop'" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='110%' viewBox='0 0 24 24' space='preserve')
      use(xlink:href='#icon-single-loop')
    svg(v-show="!setting.player.togglePlayMethod" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='120%' viewBox='0 0 24 24' space='preserve')
      use(xlink:href='#icon-single')
  div(:class="$style.footerLeftControlBtn" @click="isShowAddMusicTo = true" :tips="$t('player__add_music_to')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 512 512' space='preserve')
      use(xlink:href='#icon-add-2')
  common-list-add-modal(v-model:show="isShowAddMusicTo" :musicInfo="musicInfoItem")

</template>

<script>
import { useI18n, useRefGetter, ref, useCommit } from '@renderer/utils/vueTools'

import {
  isShowLrcSelectContent,
  setShowPlayLrcSelectContentLrc,
  isShowPlayComment,
  setShowPlayComment,
  musicInfoItem,
} from '@renderer/core/share/player'

import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'

export default {
  setup() {
    const { t } = useI18n()
    const setting = useRefGetter('setting')
    const setAudioVisualization = useCommit('setAudioVisualization')

    const toggleVisibleLrc = () => {
      setShowPlayLrcSelectContentLrc(!isShowLrcSelectContent.value)
    }
    const toggleVisibleComment = () => {
      setShowPlayComment(!isShowPlayComment.value)
    }
    const {
      nextTogglePlayName,
      toggleNextPlayMode,
    } = useNextTogglePlay({ setting, t })

    const {
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
    } = useToggleDesktopLyric({ setting, t })

    const isShowAddMusicTo = ref(false)

    const toggleAudioVisualization = () => {
      setAudioVisualization(!setting.value.player.audioVisualization)
    }

    return {
      setting,
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
      musicInfoItem,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.footerLeftControlBtns {
  color: @color-theme_2-font;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;

  .footerLeftControlBtn {
    width: 18px;
    height: 18px;
    opacity: .5;
    cursor: pointer;
    transition: opacity @transition-theme;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      opacity: .9;
    }

    +.footerLeftControlBtn {
      margin-left: 6px;
    }

    &.active {
      color: @color-theme;
      opacity: .8;
    }
  }

  .lrcBtn {
    width: 20px;
  }
}


each(@themes, {
  :global(#root.@{value}) {
    .footerLeftControlBtns {
      color: ~'@{color-@{value}-theme_2-font}';
    }
    .footerLeftControlBtn {
      &.active {
        color: ~'@{color-@{value}-theme}';
      }
    }
  }
})

</style>
