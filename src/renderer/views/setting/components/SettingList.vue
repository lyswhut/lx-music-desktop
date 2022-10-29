<template lang="pug">
dt#list {{$t('setting__list')}}
dd
  .gap-top
    base-checkbox(id="setting_list_actionButtonsVisible_enable" :modelValue="appSetting['list.actionButtonsVisible']" @update:modelValue="updateSetting({'list.actionButtonsVisible': $event})" :label="$t('setting__list_action_btn')")
  .gap-top
    base-checkbox(id="setting_list_showSource_enable" :modelValue="appSetting['list.isShowSource']" @update:modelValue="updateSetting({'list.isShowSource': $event})" :label="$t('setting__list_source')")
  .gap-top
    base-checkbox(id="setting_list_scroll_enable" :modelValue="appSetting['list.isSaveScrollLocation']" @update:modelValue="updateSetting({'list.isSaveScrollLocation': $event})" :label="$t('setting__list_scroll')")
  .gap-top
    base-checkbox(id="setting_list_clickAction_enable" :modelValue="appSetting['list.isClickPlayList']" @update:modelValue="updateSetting({'list.isClickPlayList': $event})" :label="$t('setting__list_click_action')")
dd(:aria-label="$t('setting__basic_sourcename_title')")
  h3#list_addMusicLocationType {{$t('setting__list_add_music_location_type')}}
  div
    base-checkbox.gap-left(id="setting_list_add_music_location_type_top"
      name="setting_list_add_music_location_type" need :modelValue="appSetting['list.addMusicLocationType']" @update:modelValue="updateSetting({'list.addMusicLocationType': $event})" value="top" :label="$t('setting__list_add_music_location_type_top')")
    base-checkbox.gap-left(id="setting_list_add_music_location_type_bottom"
      name="setting_list_add_music_location_type" need :modelValue="appSetting['list.addMusicLocationType']" @update:modelValue="updateSetting({'list.addMusicLocationType': $event})" value="bottom" :label="$t('setting__list_add_music_location_type_bottom')")

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
