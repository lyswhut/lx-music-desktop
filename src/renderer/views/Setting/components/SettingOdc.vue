<template lang="pug">
dt#odc {{ $t('setting__odc') }}
dd
  div(:class="$style.cardRow")
    div(:class="$style.sectionCard")
      h3#odc_options(:class="$style.sectionCardTitle") {{ $t('setting__odc_options') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(id="setting_odc_isAutoClearSearchInput" :model-value="appSetting['odc.isAutoClearSearchInput']" :label="$t('setting__odc_clear_search_input')" @update:model-value="updateSetting({'odc.isAutoClearSearchInput': $event})")
        .gap-top
          base-checkbox(id="setting_odc_isAutoClearSearchList" :model-value="appSetting['odc.isAutoClearSearchList']" :label="$t('setting__odc_clear_search_list')" @update:model-value="updateSetting({'odc.isAutoClearSearchList': $event})")
</template>

<script>
// import { ref, onBeforeUnmount } from '@common/utils/vueTools'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingOdc',
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
