<template lang="pug">
dt#list {{$t('setting__list')}}
dd
  .gap-top
    base-checkbox(id="setting_list_showSource_enable" v-model="currentStting.list.isShowSource" :label="$t('setting__list_source')")
  .gap-top
    base-checkbox(id="setting_list_scroll_enable" v-model="currentStting.list.isSaveScrollLocation" :label="$t('setting__list_scroll')")
dd(:tips="$t('setting__basic_sourcename_title')")
  h3#list_addMusicLocationType {{$t('setting__list_add_music_location_type')}}
  div
    base-checkbox.gap-left(id="setting_list_add_music_location_type_top"
      name="setting_list_add_music_location_type" need v-model="currentStting.list.addMusicLocationType" value="top" :label="$t('setting__list_add_music_location_type_top')")
    base-checkbox.gap-left(id="setting_list_add_music_location_type_bottom"
      name="setting_list_add_music_location_type" need v-model="currentStting.list.addMusicLocationType" value="bottom" :label="$t('setting__list_add_music_location_type_bottom')")

</template>

<script>
// import { ref, onBeforeUnmount } from '@renderer/utils/vueTools'
import { currentStting } from '../setting'

export default {
  name: 'SettingList',
  setup() {
    return {
      currentStting,
    }
  },
}
</script>
