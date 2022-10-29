<template lang="pug">
dt#play_detail {{$t('setting__play_detail')}}
dd
  .gap-top
    base-checkbox(id="setting_play_detail_font_zoom_enable" :modelValue="appSetting['playDetail.isZoomActiveLrc']" @update:modelValue="updateSetting({'playDetail.isZoomActiveLrc': $event})" :label="$t('setting__play_detail_font_zoom')")
  .gap-top
    base-checkbox(id="setting_play_detail_lyric_progress_enable" :modelValue="appSetting['playDetail.isShowLyricProgressSetting']" @update:modelValue="updateSetting({'playDetail.isShowLyricProgressSetting': $event})" :label="$t('setting__play_detail_lyric_progress')")

dd
  h3#play_detail_align {{$t('setting__play_detail_align')}}
  div
    base-checkbox.gap-left(id="setting_play_detail_align_left" :modelValue="appSetting['playDetail.style.align']" @update:modelValue="updateSetting({ 'playDetail.style.align': $event })" need value="left" :label="$t('setting__play_detail_align_left')")
    base-checkbox.gap-left(id="setting_play_detail_align_center" :modelValue="appSetting['playDetail.style.align']" @update:modelValue="updateSetting({ 'playDetail.style.align': $event })" need value="center" :label="$t('setting__play_detail_align_center')")
    base-checkbox.gap-left(id="setting_play_detail_align_right" :modelValue="appSetting['playDetail.style.align']" @update:modelValue="updateSetting({ 'playDetail.style.align': $event })" need value="right" :label="$t('setting__play_detail_align_right')")

</template>

<script>
// import { ref, onBeforeUnmount } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingPlayDetail',
  setup() {
    return {
      appSetting,
      updateSetting,
    }
  },
}
</script>
