<template lang="pug">
dt#play_detail {{$t('setting__play_detail')}}
dd
  .gap-top
    base-checkbox(id="setting_play_detail_font_zoom_enable" v-model="currentStting.playDetail.isZoomActiveLrc" :label="$t('setting__play_detail_font_zoom')")
  .gap-top
    base-checkbox(id="setting_play_detail_lyric_progress_enable" v-model="currentStting.playDetail.isShowLyricProgressSetting" :label="$t('setting__play_detail_detail_lyric_progress')")

dd
  h3#play_detail_align {{$t('setting__play_detail_align')}}
  div
    base-checkbox.gap-left(id="setting_play_detail_align_left" v-model="currentStting.playDetail.style.align" value="left" :label="$t('setting__play_detail_align_left')")
    base-checkbox.gap-left(id="setting_play_detail_align_center" v-model="currentStting.playDetail.style.align" value="center" :label="$t('setting__play_detail_align_center')")
    //- base-checkbox.gap-left(id="setting_play_detail_align_right" v-model="currentStting.playDetail.style.align" value="right" :label="$t('setting__play_detail_align_right')")

dd
  h3#play_detail_align {{$t('setting__play_detail_font_size')}}
  div
    p.gap-top {{$t('setting__play_detail_font_size_current', { size: currentStting.playDetail.style.fontSize })}}
    base-btn.gap-top.btn(min @click="handleResetFont") {{$t('setting__play_detail_font_size_reset')}}

</template>

<script>
// import { ref, onBeforeUnmount } from '@renderer/utils/vueTools'
import { currentStting } from '../setting'

export default {
  name: 'SettingPlayDetail',
  setup() {
    const handleResetFont = () => {
      currentStting.value.playDetail.style.fontSize = 100
    }

    return {
      currentStting,
      handleResetFont,
    }
  },
}
</script>
