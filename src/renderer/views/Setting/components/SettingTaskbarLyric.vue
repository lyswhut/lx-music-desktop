<template lang="pug">
dt#taskbar_lyric {{ $t('setting__taskbar_lyric') }}
dd
  .p {{ $t('setting__taskbar_lyric_experimental') }}
  .gap-top
    base-checkbox(
      id="setting_taskbar_lyric_enable"
      :model-value="appSetting['taskbarLyric.enable']"
      :label="$t('setting__taskbar_lyric_enable')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.enable': $event })"
    )

dd
  h3#taskbar_lyric_position {{ $t('setting__taskbar_lyric_position') }}
  div
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_position_right"
      name="setting_taskbar_lyric_position"
      need
      :model-value="appSetting['taskbarLyric.position']"
      value="right"
      :label="$t('setting__basic_control_btn_position_right')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.position': $event })"
    )
    base-checkbox.gap-left(
      id="setting_taskbar_lyric_position_center"
      name="setting_taskbar_lyric_position"
      need
      :model-value="appSetting['taskbarLyric.position']"
      value="center"
      :label="$t('setting__desktop_lyric_align_center')"
      :disabled="!isWin"
      @update:model-value="updateSetting({ 'taskbarLyric.position': $event })"
    )

dd
  h3#taskbar_lyric_content {{ $t('setting__taskbar_lyric') }}
  div
    .gap-top
      base-checkbox(
        id="setting_taskbar_lyric_show_cover"
        :model-value="appSetting['taskbarLyric.showCover']"
        :label="$t('setting__taskbar_lyric_show_cover')"
        :disabled="!isWin"
        @update:model-value="updateSetting({ 'taskbarLyric.showCover': $event })"
      )
    .gap-top
      base-checkbox(
        id="setting_taskbar_lyric_show_song_info"
        :model-value="appSetting['taskbarLyric.showSongInfo']"
        :label="$t('setting__taskbar_lyric_show_song_info')"
        :disabled="!isWin"
        @update:model-value="updateSetting({ 'taskbarLyric.showSongInfo': $event })"
      )
    .gap-top
      base-checkbox(
        id="setting_taskbar_lyric_show_current_line"
        :model-value="appSetting['taskbarLyric.showCurrentLine']"
        :label="$t('setting__taskbar_lyric_show_current_line')"
        :disabled="!isWin"
        @update:model-value="updateSetting({ 'taskbarLyric.showCurrentLine': $event })"
      )
</template>

<script>
import { isWin } from '@common/utils'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingTaskbarLyric',
  setup() {
    return {
      appSetting,
      updateSetting,
      isWin,
    }
  },
}
</script>
