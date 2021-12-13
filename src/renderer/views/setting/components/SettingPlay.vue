<template lang="pug">
dt#play {{$t('setting__play')}}
dd
  .gap-top
    base-checkbox(id="setting_player_save_play_time" v-model="currentStting.player.isSavePlayTime" :label="$t('setting__play_save_play_time')")
  .gap-top
    base-checkbox(id="setting_player_lyric_transition" v-model="currentStting.player.isShowLyricTranslation" :label="$t('setting__play_lyric_transition')")
  .gap-top
    base-checkbox(id="setting_player_lyric_s2t" v-model="currentStting.player.isS2t" :label="$t('setting__play_lyric_s2t')")
  .gap-top
    base-checkbox(id="setting_player_lyric_play_lxlrc" v-model="currentStting.player.isPlayLxlrc" :label="$t('setting__play_lyric_lxlrc')")
  .gap-top
    base-checkbox(id="setting_player_highQuality" v-model="currentStting.player.highQuality" :label="$t('setting__play_quality')")
  .gap-top
    base-checkbox(id="setting_player_showTaskProgess" v-model="currentStting.player.isShowTaskProgess" :label="$t('setting__play_task_bar')")
  .gap-top
    base-checkbox(id="setting_player_isMediaDeviceRemovedStopPlay" v-model="currentStting.player.isMediaDeviceRemovedStopPlay" :label="$t('setting__play_mediaDevice_remove_stop_play')")
dd(:tips="$t('setting__play_mediaDevice_title')")
  h3#play_mediaDevice {{$t('setting__play_mediaDevice')}}
  div
    base-selection.gap-left(:list="mediaDevices" v-model="currentStting.player.mediaDeviceId" item-key="deviceId" item-name="label")
</template>

<script>
import { ref, onBeforeUnmount, watch, nextTick } from '@renderer/utils/vueTools'
import { setTaskBarProgress } from '@renderer/utils/tools'

import { currentStting } from '../setting'

export default {
  name: 'SettingPlay',
  setup() {
    const mediaDevices = ref([])
    const getMediaDevice = async() => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      let audioDevices = devices.filter(device => device.kind === 'audiooutput')
      mediaDevices.value = audioDevices
      // console.log(this.mediaDevices)
    }
    getMediaDevice()

    navigator.mediaDevices.addEventListener('devicechange', getMediaDevice)
    onBeforeUnmount(() => {
      navigator.mediaDevices.removeEventListener('devicechange', getMediaDevice)
    })

    watch(() => currentStting.value.player.isShowTaskProgess, val => {
      if (val) return
      nextTick(() => {
        setTaskBarProgress(-1, 'normal')
      })
    })


    return {
      currentStting,
      mediaDevices,
    }
  },
}
</script>
