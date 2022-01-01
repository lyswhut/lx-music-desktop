<template lang="pug">
dt#search {{$t('setting__search')}}
dd
  .gap-top
    base-checkbox(id="setting_search_showHot_enable" v-model="currentStting.search.isShowHotSearch" :label="$t('setting__search_hot')")
  .gap-top
    base-checkbox(id="setting_search_showHistory_enable" v-model="currentStting.search.isShowHistorySearch" :label="$t('setting__search_history')")
  .gap-top
    base-checkbox(id="setting_search_focusSearchBox_enable" v-model="currentStting.search.isFocusSearchBox" :label="$t('setting__search_focus_search_box')")

</template>

<script>
// import { ref, onBeforeUnmount } from '@renderer/utils/vueTools'
import { currentStting } from '../setting'

export default {
  name: 'SettingSearch',
  setup() {
    return {
      currentStting,
    }
  },
}
</script>
