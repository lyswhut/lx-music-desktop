<template lang="pug">
dt#play_detail {{ $t('setting__play_detail') }}
dd
  div(:class="$style.cardRow")
    div(:class="$style.sectionCard")
      h3(:class="$style.sectionCardTitle") {{ $t('setting__play_detail_options') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(id="setting_play_detail_font_zoom_enable" :model-value="appSetting['playDetail.isZoomActiveLrc']" :label="$t('setting__play_detail_font_zoom')" @update:model-value="updateSetting({'playDetail.isZoomActiveLrc': $event})")
        .gap-top
          base-checkbox(id="setting_play_detail_lyric_delayScroll" :model-value="appSetting['playDetail.isDelayScroll']" :label="$t('setting__play_detail_lyric_delay_scroll')" @update:model-value="updateSetting({ 'playDetail.isDelayScroll': $event })")
        .gap-top
          base-checkbox(id="setting_play_detail_lyric_progress_enable" :model-value="appSetting['playDetail.isShowLyricProgressSetting']" :label="$t('setting__play_detail_lyric_progress')" @update:model-value="updateSetting({'playDetail.isShowLyricProgressSetting': $event})")
    div(:class="$style.sectionCard")
      h3#play_detail_align(:class="$style.sectionCardTitle") {{ $t('setting__play_detail_align') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(id="setting_play_detail_align_left" :model-value="appSetting['playDetail.style.align']" need value="left" :label="$t('setting__play_detail_align_left')" @update:model-value="updateSetting({ 'playDetail.style.align': $event })")
        .gap-top
          base-checkbox(id="setting_play_detail_align_center" :model-value="appSetting['playDetail.style.align']" need value="center" :label="$t('setting__play_detail_align_center')" @update:model-value="updateSetting({ 'playDetail.style.align': $event })")
        .gap-top
          base-checkbox(id="setting_play_detail_align_right" :model-value="appSetting['playDetail.style.align']" need value="right" :label="$t('setting__play_detail_align_right')" @update:model-value="updateSetting({ 'playDetail.style.align': $event })")

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

<style lang="less" module>
// 设置分区卡片：头部色带 + 浅色主题底，与 SettingBasic 保持一致
.sectionCard {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-primary-light-300-alpha-700);
}

// 一行两列的卡片布局
.cardRow {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.sectionCardTitle {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  background-color: var(--color-primary-light-200-alpha-600);
}

.sectionCardBody {
  padding: 12px 16px;
}
</style>
