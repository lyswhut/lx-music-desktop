<template lang="pug">
dt#list {{ $t('setting__list') }}
dd
  div(:class="$style.cardRow")
    div(:class="[$style.sectionCard, $style.wideCard]")
      h3(:class="$style.sectionCardTitle") {{ $t('setting__list_options') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(id="setting_list_actionButtonsVisible_enable" :model-value="appSetting['list.actionButtonsVisible']" :label="$t('setting__list_action_btn')" @update:model-value="updateSetting({'list.actionButtonsVisible': $event})")
        .gap-top
          base-checkbox(id="setting_list_showSource_enable" :model-value="appSetting['list.isShowSource']" :label="$t('setting__list_source')" @update:model-value="updateSetting({'list.isShowSource': $event})")
        .gap-top
          base-checkbox(id="setting_list_scroll_enable" :model-value="appSetting['list.isSaveScrollLocation']" :label="$t('setting__list_scroll')" @update:model-value="updateSetting({'list.isSaveScrollLocation': $event})")
        .gap-top
          base-checkbox(id="setting_list_clickAction_enable" :model-value="appSetting['list.isClickPlayList']" :label="$t('setting__list_click_action')" @update:model-value="updateSetting({'list.isClickPlayList': $event})")
    div(:class="$style.sectionCard")
      h3#list_addMusicLocationType(:class="$style.sectionCardTitle") {{ $t('setting__list_add_music_location_type') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(
            id="setting_list_add_music_location_type_top" name="setting_list_add_music_location_type" need
            :model-value="appSetting['list.addMusicLocationType']" value="top" :label="$t('setting__list_add_music_location_type_top')"
            @update:model-value="updateSetting({'list.addMusicLocationType': $event})")
        .gap-top
          base-checkbox(
            id="setting_list_add_music_location_type_bottom" name="setting_list_add_music_location_type" need
            :model-value="appSetting['list.addMusicLocationType']" value="bottom" :label="$t('setting__list_add_music_location_type_bottom')"
            @update:model-value="updateSetting({'list.addMusicLocationType': $event})")

</template>

<script>
// import { ref, onBeforeUnmount } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingList',
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

.wideCard {
  grid-column: span 2;
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
