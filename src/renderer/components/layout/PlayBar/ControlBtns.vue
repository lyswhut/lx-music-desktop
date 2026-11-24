<template>
  <div :class="$style.controlBtn">
    <!-- <common-volume-bar /> -->
    <button :class="[$style.titleBtn, { [$style.radioOn]: appSetting['recommend.radio'] && !playInfo.isSelectionQueue }]" :disabled="(!appSetting['recommend.radio'] || playInfo.isSelectionQueue) && !musicInfo.id" :aria-label="appSetting['recommend.radio'] && !playInfo.isSelectionQueue ? $t('explore__radio_stop') : $t('explore__radio_start')" @click="handleToggleRadio">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 512 512" space="preserve">
        <use xlink:href="#icon-explore" />
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
    <common-volume-btn />
    <common-toggle-play-mode-btn />
    <common-list-add-modal v-model:show="isShowAddMusicTo" :music-info="playMusicInfo.musicInfo" />
  </div>
</template>

<script>
import { startSession } from '@renderer/core/recommend/session'
import { ref } from '@common/utils/vueTools'
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
import { musicInfo, playInfo, playMusicInfo } from '@renderer/store/player/state'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { useRouter } from '@common/utils/vueRouter'

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
    // 探索电台开/关（D10 播放栏常驻开关）：只写设置项，
    // 开台/收台由 session 层统一响应 recommend.radio 变化完成（双入口同源，见 initRecommendRadio）
    const handleToggleRadio = () => {
      if (playInfo.isSelectionQueue && appSetting['recommend.radio']) {
        if (!musicInfo.id) return
        void router.push('/explore')
        void startSession().catch(console.warn)
        return
      }
      if (appSetting['recommend.radio']) {
        updateSetting({ 'recommend.radio': false })
        return
      }
      if (!musicInfo.id) return
      // 先跳转页面再开台（初始计划较慢，页面负责展示进度/错误）
      void router.push('/explore')
      updateSetting({ 'recommend.radio': true })
    }
    return {
      appSetting,
      isShowAddMusicTo,
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
      addMusicTo,
      musicInfo,
      playMusicInfo,
      playInfo,
      handleToggleRadio,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.controlBtn {
  padding-left: 8px;
  padding-right: 4px;
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 3px;

  button {
    color: var(--color-font-label);
  }
}

.titleBtn {
  flex: none;
  height: 30px;
  width: 30px;
  border-radius: var(--ui-radius-sm);
  transition: background-color @transition-fast, color @transition-fast, opacity @transition-fast;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border: none;
  padding: 6px;
  box-sizing: border-box;

  opacity: .78;
  cursor: pointer;

  &:hover {
    opacity: 1;
    color: var(--color-font);
    background-color: var(--ui-surface-hover);
  }
  &:active {
    opacity: 1;
    background-color: var(--ui-surface-active);
  }
  &[disabled] {
    opacity: .3;
    cursor: default;
    &:hover {
      background-color: transparent;
    }
  }
}

@media (max-width: 960px) {
  .controlBtn {
    padding-left: 2px;
    padding-right: 1px;
    gap: 1px;
    > div > button {
      width: 22px;
      height: 24px;
    }
  }
  .titleBtn {
    width: 24px;
    height: 24px;
    padding: 4px;
  }
}

// 电台开启状态样式：主题主色胶囊标示“正在跟随切歌”
.radioOn {
  color: var(--color-primary) !important;
  background-color: var(--ui-surface-active);
  opacity: 1;
  &:hover {
    background-color: var(--ui-surface-active);
    background-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
  }
}

</style>
