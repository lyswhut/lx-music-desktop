<template lang="pug">
dt#odc {{ $t('setting__odc') }}
dd
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
