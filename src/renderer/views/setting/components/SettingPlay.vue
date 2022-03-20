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
dd(:aria-label="$t('setting__play_mediaDevice_title')")
  h3#play_mediaDevice {{$t('setting__play_mediaDevice')}}
  div
    base-selection.gap-left(:list="mediaDevices" v-model="mediaDeviceId" @change="handleMediaDeviceIdChnage" item-key="deviceId" item-name="label")
</template>

<script>
import { ref, onBeforeUnmount, watch, nextTick, useI18n } from '@renderer/utils/vueTools'
import { setTaskBarProgress } from '@renderer/utils/tools'
import { hasInitedAnalyser } from '@renderer/plugins/player'
import { dialog } from '@renderer/plugins/Dialog'

import { currentStting } from '../setting'

export default {
  name: 'SettingPlay',
  setup() {
    const { t } = useI18n()

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

    const mediaDeviceId = ref(currentStting.value.player.mediaDeviceId)
    const handleMediaDeviceIdChnage = async() => {
      if (hasInitedAnalyser()) {
        await dialog({
          message: t('setting__play_media_device_error_tip'),
          confirmButtonText: t('alert_button_text'),
        })
        mediaDeviceId.value = currentStting.value.player.mediaDeviceId
      } else if (currentStting.value.player.audioVisualization) {
        const confirm = await dialog.confirm({
          message: t('setting__play_media_device_tip'),
          cancelButtonText: t('cancel_button_text'),
          confirmButtonText: t('confirm_button_text'),
        })
        if (confirm) {
          currentStting.value.player.audioVisualization = false
          currentStting.value.player.mediaDeviceId = mediaDeviceId.value
        } else {
          mediaDeviceId.value = currentStting.value.player.mediaDeviceId
        }
      } else {
        currentStting.value.player.mediaDeviceId = mediaDeviceId.value
      }
    }
    watch(() => currentStting.value.player.mediaDeviceId, val => {
      mediaDeviceId.value = val
    })


    return {
      currentStting,
      mediaDevices,
      mediaDeviceId,
      handleMediaDeviceIdChnage,
    }
  },
}
</script>
