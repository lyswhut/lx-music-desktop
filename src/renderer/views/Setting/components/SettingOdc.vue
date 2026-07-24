<template lang="pug">
dt#odc {{ $t('setting__odc') }}
dd
  div.setting-card.setting-card-full
    .setting-card-header {{ $t('setting__odc') }}
    .setting-card-body
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

<style lang="less">
.setting-card {
  display: block;
  box-sizing: border-box;
  background-color: rgba(77, 175, 124, 0.12);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(77, 175, 124, 0.25);
  overflow: hidden;
  margin: 0 0 10px;
  max-width: 420px;
}
.setting-card-full {
  display: block;
  max-width: none !important;
  width: 100%;
  margin-bottom: 5px;
}
.setting-card-header {
  padding: 8px 16px;
  font-weight: bold;
  font-size: 13px;
  color: var(--color-primary);
  border-bottom: 1px solid rgba(77, 175, 124, 0.25);
}
.setting-card-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}
</style>

