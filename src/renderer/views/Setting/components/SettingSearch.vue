<template lang="pug">
dt#search {{ $t('setting__search') }}
dd
  div(:class="$style.cardRow")
    div(:class="$style.sectionCard")
      h3#search_options(:class="$style.sectionCardTitle") {{ $t('setting__search_options') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(id="setting_search_showHot_enable" :model-value="appSetting['search.isShowHotSearch']" :label="$t('setting__search_hot')" @update:model-value="updateSetting({'search.isShowHotSearch': $event})")
        .gap-top
          base-checkbox(id="setting_search_showHistory_enable" :model-value="appSetting['search.isShowHistorySearch']" :label="$t('setting__search_history')" @update:model-value="updateSetting({'search.isShowHistorySearch': $event})")
        .gap-top
          base-checkbox(id="setting_search_focusSearchBox_enable" :model-value="appSetting['search.isFocusSearchBox']" :label="$t('setting__search_focus_search_box')" @update:model-value="updateSetting({'search.isFocusSearchBox': $event})")

</template>

<script>
// import { ref, onBeforeUnmount } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingSearch',
  setup() {
    return {
      appSetting,
      updateSetting,
    }
  },
}
</script>

<style lang="less" module>
// 设置分区卡片：头部色带 + 浅色主题底，与其他设置页一致
.sectionCard {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-primary-light-300-alpha-700);
}

.cardRow {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
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
