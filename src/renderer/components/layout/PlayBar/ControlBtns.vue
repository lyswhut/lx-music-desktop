<template>
  <div :class="$style.controlBtn">
    <button ignore-tip :class="[$style.titleBtn, 'chrome-ib', { active: appSetting['desktopLyric.enable'] }]" :aria-label="toggleDesktopLyricBtnTitle" @click="toggleDesktopLyric" @contextmenu="toggleLockDesktopLyric">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <use xlink:href="#icon-line-lyric" />
      </svg>
    </button>
    <common-volume-btn />
    <button v-if="!isShowPlayerDetail" ignore-tip :class="[$style.titleBtn, 'chrome-ib', { active: isShowQueue }]" :aria-label="isShowQueue ? $t('player__queue_close') : $t('player__queue_open')" @click="toggleShowQueue">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <use xlink:href="#icon-line-queue" />
      </svg>
    </button>
  </div>
</template>

<script>
import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
import { isShowQueue, isShowPlayerDetail } from '@renderer/store/player/state'
import { toggleShowQueue } from '@renderer/store/player/action'
import { appSetting } from '@renderer/store/setting'

export default {
  setup() {
    const {
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
    } = useToggleDesktopLyric()
    return {
      appSetting,
      toggleDesktopLyricBtnTitle,
      toggleDesktopLyric,
      toggleLockDesktopLyric,
      isShowQueue,
      isShowPlayerDetail,
      toggleShowQueue,
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
  align-items: center;
  justify-self: end;
  gap: 6px;
}

.titleBtn {
  flex: none;
}


</style>
