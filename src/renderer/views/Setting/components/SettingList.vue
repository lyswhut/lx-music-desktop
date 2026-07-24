<template lang="pug">
dt#list {{ $t('setting__list') }}
dd.cards-row.list-cards-row
  div.setting-card
    .setting-card-header {{ $t('setting__list') }}
    .setting-card-body
      .gap-top
        base-checkbox(id="setting_list_actionButtonsVisible_enable" :model-value="appSetting['list.actionButtonsVisible']" :label="$t('setting__list_action_btn')" @update:model-value="updateSetting({'list.actionButtonsVisible': $event})")
      .gap-top
        base-checkbox(id="setting_list_showSource_enable" :model-value="appSetting['list.isShowSource']" :label="$t('setting__list_source')" @update:model-value="updateSetting({'list.isShowSource': $event})")
      .gap-top
        base-checkbox(id="setting_list_scroll_enable" :model-value="appSetting['list.isSaveScrollLocation']" :label="$t('setting__list_scroll')" @update:model-value="updateSetting({'list.isSaveScrollLocation': $event})")
      .gap-top
        base-checkbox(id="setting_list_clickAction_enable" :model-value="appSetting['list.isClickPlayList']" :label="$t('setting__list_click_action')" @update:model-value="updateSetting({'list.isClickPlayList': $event})")
  div.setting-card
    .setting-card-header {{ $t('setting__list_add_music_location_type') }}
    .setting-card-body
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

<style lang="less">
dd.cards-row.list-cards-row {
  display: flex !important;
  flex-flow: row nowrap !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  gap: 15px !important;
  padding: 0;
  margin: 0 0 10px;
  width: 100%;

  > .setting-card {
    margin: 0;
    flex: 0 0 auto !important;
    width: fit-content !important;
    max-width: none !important;
    min-width: 0 !important;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background-color: rgba(77, 175, 124, 0.12);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    border: 1px solid rgba(77, 175, 124, 0.25);
    overflow: hidden;

    .setting-card-header {
      padding: 8px 16px;
      font-weight: bold;
      font-size: 13px;
      color: var(--color-primary);
      border-bottom: 1px solid rgba(77, 175, 124, 0.25);
      width: 100%;
      box-sizing: border-box;
      white-space: nowrap;
    }

    .setting-card-body {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      box-sizing: border-box;

      .gap-top {
        margin-left: 0 !important;
        margin-top: 10px;
        width: fit-content !important;
        display: block;
        text-align: left;
        white-space: nowrap;

        &:first-child {
          margin-top: 0;
        }

        label {
          justify-content: flex-start;
          white-space: nowrap;
        }
      }

      .gap-left {
        margin-left: 0 !important;
        margin-top: 10px;
        width: fit-content !important;
        display: block;
        text-align: left;
        white-space: nowrap;

        &:first-child {
          margin-top: 0;
        }

        label {
          justify-content: flex-start;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
