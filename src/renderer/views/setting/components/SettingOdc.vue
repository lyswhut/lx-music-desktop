<template lang="pug">
dt#odc {{$t('setting__odc')}}
dd
  .gap-top
    base-checkbox(id="setting_odc_isAutoClearSearchInput" v-model="currentStting.odc.isAutoClearSearchInput" :label="$t('setting__odc_clear_search_input')")
  .gap-top
    base-checkbox(id="setting_odc_isAutoClearSearchList" v-model="currentStting.odc.isAutoClearSearchList" :label="$t('setting__odc_clear_search_list')")
</template>

<script>
// import { ref, onBeforeUnmount } from '@renderer/utils/vueTools'
import { currentStting } from '../setting'

export default {
  name: 'SettingOdc',
  setup() {
    return {
      currentStting,
    }
  },
}
</script>
