<template lang="pug">
dt#list {{ $t('setting__list') }}
dd
  .gap-top
    base-checkbox(id="setting_list_actionButtonsVisible_enable" :model-value="appSetting['list.actionButtonsVisible']" :label="$t('setting__list_action_btn')" @update:model-value="updateSetting({'list.actionButtonsVisible': $event})")
  .gap-top
    base-checkbox(id="setting_list_showSource_enable" :model-value="appSetting['list.isShowSource']" :label="$t('setting__list_source')" @update:model-value="updateSetting({'list.isShowSource': $event})")
  .gap-top
    base-checkbox(id="setting_list_scroll_enable" :model-value="appSetting['list.isSaveScrollLocation']" :label="$t('setting__list_scroll')" @update:model-value="updateSetting({'list.isSaveScrollLocation': $event})")
  .gap-top
    base-checkbox(id="setting_list_clickAction_enable" :model-value="appSetting['list.isClickPlayList']" :label="$t('setting__list_click_action')" @update:model-value="updateSetting({'list.isClickPlayList': $event})")
dd(:aria-label="$t('setting__list_cover_title')")
  h3#list_cover {{ $t('setting__list_cover') }}
  div
    .gap-top
      base-checkbox(id="setting_list_show_cover" :model-value="appSetting['list.isShowCover']" :label="$t('setting__list_show_cover')" @update:model-value="updateSetting({'list.isShowCover': $event})")
    .gap-top(v-if="appSetting['list.isShowCover']")
      base-selection.gap-left(:list="coverSizeList" :model-value="appSetting['list.coverSize']" item-key="id" item-name="label" @update:model-value="updateSetting({'list.coverSize': $event})")
dd(:aria-label="$t('setting__basic_sourcename_title')")
  h3#list_addMusicLocationType {{ $t('setting__list_add_music_location_type') }}
  div
    base-checkbox.gap-left(
      id="setting_list_add_music_location_type_top" name="setting_list_add_music_location_type" need
      :model-value="appSetting['list.addMusicLocationType']" value="top" :label="$t('setting__list_add_music_location_type_top')"
      @update:model-value="updateSetting({'list.addMusicLocationType': $event})")
    base-checkbox.gap-left(
      id="setting_list_add_music_location_type_bottom" name="setting_list_add_music_location_type" need
      :model-value="appSetting['list.addMusicLocationType']" value="bottom" :label="$t('setting__list_add_music_location_type_bottom')"
      @update:model-value="updateSetting({'list.addMusicLocationType': $event})")

</template>

<script>
// import { ref, onBeforeUnmount } from '@common/utils/vueTools'
import { computed } from '@common/utils/vueTools'
import { useI18n } from '@root/lang'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingList',
  setup() {
    const t = useI18n()

    const coverSizeList = computed(() => {
      return [
        { id: 32, label: t('setting__list_cover_size_32px') },
        { id: 44, label: t('setting__list_cover_size_44px') },
        { id: 56, label: t('setting__list_cover_size_56px') },
        { id: 72, label: t('setting__list_cover_size_72px') },
      ]
    })

    return {
      appSetting,
      updateSetting,
      coverSizeList,
    }
  },
}
</script>
