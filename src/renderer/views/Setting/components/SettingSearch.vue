<template lang="pug">
dt#search {{$t('setting__search')}}
dd
  .gap-top
    base-checkbox(id="setting_search_showHot_enable" :modelValue="appSetting['search.isShowHotSearch']" @update:modelValue="updateSetting({'search.isShowHotSearch': $event})" :label="$t('setting__search_hot')")
  .gap-top
    base-checkbox(id="setting_search_showHistory_enable" :modelValue="appSetting['search.isShowHistorySearch']" @update:modelValue="updateSetting({'search.isShowHistorySearch': $event})" :label="$t('setting__search_history')")
  .gap-top
    base-checkbox(id="setting_search_focusSearchBox_enable" :modelValue="appSetting['search.isFocusSearchBox']" @update:modelValue="updateSetting({'search.isFocusSearchBox': $event})" :label="$t('setting__search_focus_search_box')")

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
