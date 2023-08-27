<template lang="pug">
dt#download {{ $t('setting__download') }}
dd
  .gap-top
    base-checkbox(id="setting_download_enable" :model-value="appSetting['download.enable']" :label="$t('setting__download_enable')" @update:model-value="updateSetting({'download.enable': $event})")
  .gap-top
    base-checkbox(id="setting_download_skip_exist_file" :model-value="appSetting['download.skipExistFile']" :label="$t('setting__download_skip_exist_file')" @update:model-value="updateSetting({'download.skipExistFile': $event})")
dd(:aria-label="$t('setting__download_path_title')")
  h3#download_path {{ $t('setting__download_path') }}
  div
    .p
      | {{ $t('setting__download_path_label') }}
      span.auto-hidden.hover(:class="$style.savePath" :aria-label="$t('setting__download_path_open_label')" @click="openDirInExplorer(appSetting['download.savePath'])") {{ appSetting['download.savePath'] }}
    .p
      base-btn.btn(min @click="handleChangeSavePath") {{ $t('setting__download_path_change_btn') }}
dd
  h3#download_use_other_source
    | {{ $t('setting__download_use_other_source') }}
    svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__download_use_other_source_tip')")
  div
    base-checkbox(id="setting_download_isUseOtherSource" :model-value="appSetting['download.isUseOtherSource']" :label="$t('setting__is_enable')" @update:model-value="updateSetting({'download.isUseOtherSource': $event})")
  div
dd(:aria-label="$t('setting__download_name_title')")
  h3#download_name {{ $t('setting__download_name') }}
  div
    base-checkbox.gap-left(
v-for="item in musicNames" :id="`setting_download_musicName_${item.value}`" :key="item.value" name="setting_download_musicName" :value="item.value"
        need :model-value="appSetting['download.fileName']" :label="item.name" @update:model-value="updateSetting({'download.fileName': $event})")
dd
  h3#download_data_embed {{ $t('setting__download_data_embed') }}
  .gap-top
    base-checkbox(id="setting_download_isEmbedPic" :model-value="appSetting['download.isEmbedPic']" :label="$t('setting__download_embed_pic')" @update:model-value="updateSetting({'download.isEmbedPic': $event})")
  .gap-top
    base-checkbox(id="setting_download_isEmbedLyric" :model-value="appSetting['download.isEmbedLyric']" :label="$t('setting__download_embed_lyric')" @update:model-value="updateSetting({'download.isEmbedLyric': $event})")
  .gap-top
    base-checkbox(id="setting_download_isEmbedLyricT" :disabled="!appSetting['download.isEmbedLyric']" :model-value="appSetting['download.isEmbedLyricT']" :label="$t('setting__download_embed_tlyric')" @update:model-value="updateSetting({'download.isEmbedLyricT': $event})")
  .gap-top
    base-checkbox(id="setting_download_isEmbedLyricR" :disabled="!appSetting['download.isEmbedLyric']" :model-value="appSetting['download.isEmbedLyricR']" :label="$t('setting__download_embed_rlyric')" @update:model-value="updateSetting({'download.isEmbedLyricR': $event})")
dd(:aria-label="$t('setting__download_lyric_title')")
  h3#download_lyric {{ $t('setting__download_lyric') }}
  .gap-top
    base-checkbox(id="setting_download_isDownloadLrc" :model-value="appSetting['download.isDownloadLrc']" :label="$t('setting__is_enable')" @update:model-value="updateSetting({'download.isDownloadLrc': $event})")
  .gap-top
    base-checkbox(id="setting_download_isDownloadTLrc" :disabled="!appSetting['download.isDownloadLrc']" :model-value="appSetting['download.isDownloadTLrc']" :label="$t('setting__download_tlyric')" @update:model-value="updateSetting({'download.isDownloadTLrc': $event})")
  .gap-top
    base-checkbox(id="setting_download_isDownloadRLrc" :disabled="!appSetting['download.isDownloadLrc']" :model-value="appSetting['download.isDownloadRLrc']" :label="$t('setting__download_rlyric')" @update:model-value="updateSetting({'download.isDownloadRLrc': $event})")
dd
  h3#download_lyric_format {{ $t('setting__download_lyric_format') }}
  div
    base-checkbox.gap-left(
      v-for="item in lrcFormatList" :id="`setting_download_lrcFormat_${item.id}`" :key="item.id"
      name="setting_download_lrcFormat" need :model-value="appSetting['download.lrcFormat']" :value="item.id" :label="item.name"
      @update:model-value="updateSetting({'download.lrcFormat': $event})")
</template>

<script>
import { computed } from '@common/utils/vueTools'
// import { getSystemFonts } from '@renderer/utils/tools'
import { openDirInExplorer } from '@common/utils/electron'
import { showSelectDialog } from '@renderer/utils/ipc'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingDownload',
  setup() {
    const t = useI18n()

    const handleChangeSavePath = () => {
      void showSelectDialog({
        title: t('setting__download_select_save_path'),
        defaultPath: appSetting['download.savePath'],
        properties: ['openDirectory'],
      }).then(result => {
        if (result.canceled) return
        updateSetting({ 'download.savePath': result.filePaths[0] })
      })
    }

    const musicNames = computed(() => {
      return [
        { value: '歌名 - 歌手', name: t('setting__download_name1') },
        { value: '歌手 - 歌名', name: t('setting__download_name2') },
        { value: '歌名', name: t('setting__download_name3') },
      ]
    })

    const lrcFormatList = computed(() => {
      return [
        { id: 'utf8', name: t('setting__download_lyric_format_utf8') },
        { id: 'gbk', name: t('setting__download_lyric_format_gbk') },
      ]
    })

    return {
      appSetting,
      updateSetting,
      openDirInExplorer,
      handleChangeSavePath,
      musicNames,
      lrcFormatList,
    }
  },
}
</script>

<style lang="less" module>
// .savePath {
//   font-size: 12px;
// }
</style>
