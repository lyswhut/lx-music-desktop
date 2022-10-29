<template lang="pug">
dt#odc {{$t('setting__odc')}}
dd
  .gap-top
    base-checkbox(id="setting_odc_isAutoClearSearchInput" :modelValue="appSetting['odc.isAutoClearSearchInput']" @update:modelValue="updateSetting({'odc.isAutoClearSearchInput': $event})" :label="$t('setting__odc_clear_search_input')")
  .gap-top
    base-checkbox(id="setting_odc_isAutoClearSearchList" :modelValue="appSetting['odc.isAutoClearSearchList']" @update:modelValue="updateSetting({'odc.isAutoClearSearchList': $event})" :label="$t('setting__odc_clear_search_list')")
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
