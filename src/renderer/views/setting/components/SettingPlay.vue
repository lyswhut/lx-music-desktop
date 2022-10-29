<template lang="pug">
dt#play {{$t('setting__play')}}
dd
  .gap-top
    base-checkbox(id="setting_player_startup_auto_play" :modelValue="appSetting['player.startupAutoPlay']" @update:modelValue="updateSetting({'player.startupAutoPlay': $event})" :label="$t('setting__play_startup_auto_play')")
  .gap-top
    base-checkbox(id="setting_player_save_play_time" :modelValue="appSetting['player.isSavePlayTime']" @update:modelValue="updateSetting({'player.isSavePlayTime': $event})" :label="$t('setting__play_save_play_time')")
  .gap-top
    base-checkbox(id="setting_player_lyric_transition" :modelValue="appSetting['player.isShowLyricTranslation']" @update:modelValue="updateSetting({'player.isShowLyricTranslation': $event})" :label="$t('setting__play_lyric_transition')")
  .gap-top
    base-checkbox(id="setting_player_lyric_roma" :modelValue="appSetting['player.isShowLyricRoma']" @update:modelValue="updateSetting({'player.isShowLyricRoma': $event})" :label="$t('setting__play_lyric_roma')")
  .gap-top
    base-checkbox(id="setting_player_auto_skip_on_error" :modelValue="appSetting['player.autoSkipOnError']" @update:modelValue="updateSetting({'player.autoSkipOnError': $event})" :label="$t('setting__play_auto_skip_on_error')")
  .gap-top
    base-checkbox(id="setting_player_lyric_s2t" :modelValue="appSetting['player.isS2t']" @update:modelValue="updateSetting({'player.isS2t': $event})" :label="$t('setting__play_lyric_s2t')")
  .gap-top
    base-checkbox(id="setting_player_lyric_play_lxlrc" :modelValue="appSetting['player.isPlayLxlrc']" @update:modelValue="updateSetting({'player.isPlayLxlrc': $event})" :label="$t('setting__play_lyric_lxlrc')")
  .gap-top
    base-checkbox(id="setting_player_highQuality" :modelValue="appSetting['player.highQuality']" @update:modelValue="updateSetting({'player.highQuality': $event})" :label="$t('setting__play_quality')")
  .gap-top
    base-checkbox(id="setting_player_showTaskProgess" :modelValue="appSetting['player.isShowTaskProgess']" @update:modelValue="updateSetting({'player.isShowTaskProgess': $event})" :label="$t('setting__play_task_bar')")
  .gap-top
    base-checkbox(id="setting_player_isMediaDeviceRemovedStopPlay" :modelValue="appSetting['player.isMediaDeviceRemovedStopPlay']" @update:modelValue="updateSetting({'player.isMediaDeviceRemovedStopPlay': $event})" :label="$t('setting__play_mediaDevice_remove_stop_play')")
dd(:aria-label="$t('setting__play_mediaDevice_title')")
  h3#play_mediaDevice {{$t('setting__play_mediaDevice')}}
  div
    base-selection.gap-left(:list="mediaDevices" v-model="mediaDeviceId" @change="handleMediaDeviceIdChnage" item-key="deviceId" item-name="label")
</template>

<script>
import { ref, onBeforeUnmount, watch } from '@common/utils/vueTools'
import { hasInitedAnalyser } from '@renderer/plugins/player'
import { dialog } from '@renderer/plugins/Dialog'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'


export default {
  name: 'SettingPlay',
  setup() {
    const t = useI18n()

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

    const mediaDeviceId = ref(appSetting['player.mediaDeviceId'])
    const handleMediaDeviceIdChnage = async() => {
      if (hasInitedAnalyser()) {
        await dialog({
          message: t('setting__play_media_device_error_tip'),
          confirmButtonText: t('alert_button_text'),
        })
        mediaDeviceId.value = appSetting['player.mediaDeviceId']
      } else if (appSetting['player.audioVisualization']) {
        const confirm = await dialog.confirm({
          message: t('setting__play_media_device_tip'),
          cancelButtonText: t('cancel_button_text'),
          confirmButtonText: t('confirm_button_text'),
        })
        if (confirm) {
          appSetting['player.audioVisualization'] = false
          appSetting['player.mediaDeviceId'] = mediaDeviceId.value
        } else {
          mediaDeviceId.value = appSetting['player.mediaDeviceId']
        }
      } else {
        appSetting['player.mediaDeviceId'] = mediaDeviceId.value
      }
    }
    watch(() => appSetting['player.mediaDeviceId'], val => {
      mediaDeviceId.value = val
    })


    return {
      appSetting,
      updateSetting,
      mediaDevices,
      mediaDeviceId,
      handleMediaDeviceIdChnage,
    }
  },
}
</script>
