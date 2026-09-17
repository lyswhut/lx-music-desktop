<template>
  <material-popup-btn ref="btn_ref" :class="$style.btnContent">
    <button :class="['chrome-ib', 'sm', 'fill', { on: isRepeatOn }]" :aria-label="nextTogglePlayName">
      <svg
        v-if="appSetting['player.togglePlayMethod'] == 'listLoop'"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xlink="http://www.w3.org/1999/xlink"
        height="80%" viewBox="0 0 24 24" space="preserve"
      >
        <use xlink:href="#icon-list-loop" />
      </svg>
      <svg
        v-else-if="appSetting['player.togglePlayMethod'] == 'random'"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xlink="http://www.w3.org/1999/xlink"
        height="80%" viewBox="0 0 24 24" space="preserve"
      >
        <use xlink:href="#icon-list-random" />
      </svg>
      <svg
        v-else-if="appSetting['player.togglePlayMethod'] == 'list'"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xlink="http://www.w3.org/1999/xlink"
        width="100%" viewBox="0 0 32 32" space="preserve"
      >
        <use xlink:href="#icon-list-order" />
      </svg>
      <svg
        v-else-if="appSetting['player.togglePlayMethod'] == 'singleLoop'"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xlink="http://www.w3.org/1999/xlink"
        width="100%" viewBox="0 0 24 24" space="preserve"
      >
        <use xlink:href="#icon-single-loop" />
      </svg>
      <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 32 32" space="preserve">
        <use xlink:href="#icon-single" />
      </svg>
    </button>
    <template #content>
      <div :class="$style.setting">
        <button class="chrome-ib sm fill" :aria-label="$t('player__play_toggle_mode_list_loop')" @click="toggleMode('listLoop')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-list-loop" />
          </svg>
        </button>
        <button class="chrome-ib sm fill" :aria-label="$t('player__play_toggle_mode_random')" @click="toggleMode('random')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-list-random" />
          </svg>
        </button>
        <button class="chrome-ib sm fill" :aria-label="$t('player__play_toggle_mode_list')" @click="toggleMode('list')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 32 32" space="preserve">
            <use xlink:href="#icon-list-order" />
          </svg>
        </button>
        <button class="chrome-ib sm fill" :aria-label="$t('player__play_toggle_mode_single_loop')" @click="toggleMode('singleLoop')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
            <use xlink:href="#icon-single-loop" />
          </svg>
        </button>
        <button class="chrome-ib sm fill" :aria-label="$t('player__play_toggle_mode_off')" @click="toggleMode('none')">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 32 32" space="preserve">
            <use xlink:href="#icon-single" />
          </svg>
        </button>
      </div>
    </template>
  </material-popup-btn>
</template>

<script setup>
import { computed, ref } from '@common/utils/vueTools'
// import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
// import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
// import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
import { appSetting } from '@renderer/store/setting'
import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'

const btn_ref = ref(null)

const {
  nextTogglePlayName,
  toggleNextPlayMode,
} = useNextTogglePlay()

const isRepeatOn = computed(() => {
  const method = appSetting['player.togglePlayMethod']
  return method == 'listLoop' || method == 'singleLoop'
})

const toggleMode = (mode) => {
  btn_ref.value.hide()
  toggleNextPlayMode(mode)
}

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.btnContent {
  flex: none;
  width: 26px;
  height: 26px;
  :global(.chrome-ib) svg {
    width: 15px;
    height: 15px;
  }
}

.setting {
  display: flex;
  flex-flow: row nowrap;
  font-size: 14px;
  gap: 10px;
}


</style>
