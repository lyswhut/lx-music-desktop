<template lang="pug">
dt#download {{ $t('setting__download') }}
dd.cards-row.download-cards-row
  div.setting-card
    .setting-card-header {{ $t('setting__download') }}
    .setting-card-body
      .gap-top
        base-checkbox(id="setting_download_enable" :model-value="appSetting['download.enable']" :label="$t('setting__download_enable')" @update:model-value="updateSetting({'download.enable': $event})")
      .gap-top
        base-checkbox(id="setting_download_skip_exist_file" :model-value="appSetting['download.skipExistFile']" :label="$t('setting__download_skip_exist_file')" @update:model-value="updateSetting({'download.skipExistFile': $event})")
      .gap-top
        base-checkbox(id="setting_download_save_group_list_name" :model-value="appSetting['download.isSavePathGroupByListName']" :label="$t('setting_download_save_group_list_name')" @update:model-value="updateSetting({'download.isSavePathGroupByListName': $event})")
  div.setting-card
    .setting-card-header {{ $t('setting__download_path') }}
    .setting-card-body
      .gap-top.download-path-row
        | {{ $t('setting__download_path_label') }}
        span.auto-hidden.hover(:class="$style.savePath" :aria-label="$t('setting__download_path_open_label')" @click="openDirInExplorer(appSetting['download.savePath'])") {{ appSetting['download.savePath'] }}
        base-btn.btn.gap-left.inline-btn(min @click="handleChangeSavePath") {{ $t('setting__download_path_change_btn') }}
  div.setting-card
    .setting-card-header
      | {{ $t('setting__download_max_num') }}
      svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__download_max_num_tooltip')")
    .setting-card-body
      .p
        base-selection.gap-left(:class="$style.selectWidth" :model-value="appSetting['download.maxDownloadNum']" :list="maxNums" item-key="id" item-name="id" @change="handleUpdateMaxNum")
  div.setting-card
    .setting-card-header
      | {{ $t('setting__download_use_other_source') }}
      svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__download_use_other_source_tip')")
    .setting-card-body
      base-checkbox(id="setting_download_isUseOtherSource" :model-value="appSetting['download.isUseOtherSource']" :label="$t('setting__is_enable')" @update:model-value="updateSetting({'download.isUseOtherSource': $event})")
dd.cards-row.download-cards-row
  div.setting-card
    .setting-card-header {{ $t('setting__download_name') }}
    .setting-card-body
      base-checkbox.gap-left(
        v-for="item in musicNames" :id="`setting_download_musicName_${item.value}`" :key="item.value" name="setting_download_musicName" :value="item.value"
        need :model-value="appSetting['download.fileName']" :label="item.name" @update:model-value="updateSetting({'download.fileName': $event})")
  div.setting-card
    .setting-card-header {{ $t('setting__download_data_embed') }}
    .setting-card-body
      .gap-top
        base-checkbox(id="setting_download_isEmbedPic" :model-value="appSetting['download.isEmbedPic']" :label="$t('setting__download_embed_pic')" @update:model-value="updateSetting({'download.isEmbedPic': $event})")
      .gap-top
        base-checkbox(id="setting_download_isEmbedLyric" :model-value="appSetting['download.isEmbedLyric']" :label="$t('setting__download_embed_lyric')" @update:model-value="updateSetting({'download.isEmbedLyric': $event})")
      .gap-top
        base-checkbox(id="setting_download_isEmbedLyricT" :disabled="!appSetting['download.isEmbedLyric']" :model-value="appSetting['download.isEmbedLyricT']" :label="$t('setting__download_embed_tlyric')" @update:model-value="updateSetting({'download.isEmbedLyricT': $event})")
      .gap-top
        base-checkbox(id="setting_download_isEmbedLyricR" :disabled="!appSetting['download.isEmbedLyric']" :model-value="appSetting['download.isEmbedLyricR']" :label="$t('setting__download_embed_rlyric')" @update:model-value="updateSetting({'download.isEmbedLyricR': $event})")
      .gap-top
        base-checkbox(id="setting_download_isEmbedLyricLx" :disabled="!appSetting['download.isEmbedLyric']" :model-value="appSetting['download.isEmbedLyricLx']" :label="$t('setting__download_embed_lxlyric')" @update:model-value="updateSetting({'download.isEmbedLyricLx': $event})")
dd.cards-row.download-cards-row
  div.setting-card
    .setting-card-header {{ $t('setting__download_lyric') }}
    .setting-card-body
      .gap-top
        base-checkbox(id="setting_download_isDownloadLrc" :model-value="appSetting['download.isDownloadLrc']" :label="$t('setting__is_enable')" @update:model-value="updateSetting({'download.isDownloadLrc': $event})")
      .gap-top
        base-checkbox(id="setting_download_isDownloadTLrc" :disabled="!appSetting['download.isDownloadLrc']" :model-value="appSetting['download.isDownloadTLrc']" :label="$t('setting__download_tlyric')" @update:model-value="updateSetting({'download.isDownloadTLrc': $event})")
      .gap-top
        base-checkbox(id="setting_download_isDownloadRLrc" :disabled="!appSetting['download.isDownloadLrc']" :model-value="appSetting['download.isDownloadRLrc']" :label="$t('setting__download_rlyric')" @update:model-value="updateSetting({'download.isDownloadRLrc': $event})")
      .gap-top
        base-checkbox(id="setting_download_isDownloadLxLrc" :disabled="!appSetting['download.isDownloadLrc']" :model-value="appSetting['download.isDownloadLxLrc']" :label="$t('setting__download_lxlyric')" @update:model-value="updateSetting({'download.isDownloadLxLrc': $event})")
  div.setting-card
    .setting-card-header
      | {{ $t('setting__download_lyric_format') }}
      svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__download_lyric_format_tip')")
    .setting-card-body
      base-checkbox.gap-left(
        v-for="item in lrcFormatList" :id="`setting_download_lrcFormat_${item.id}`" :key="item.id"
        name="setting_download_lrcFormat" need :model-value="appSetting['download.lrcFormat']" :value="item.id" :label="item.name"
        @update:model-value="updateSetting({'download.lrcFormat': $event})")
</template>

<script>
import { computed } from '@common/utils/vueTools'
// import { getSystemFonts } from '@renderer/utils/tools'
import { showSelectDialog, openDirInExplorer } from '@renderer/utils/ipc'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { dialog } from '@renderer/plugins/Dialog'

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

    const maxNums = new Array(6).fill(null).map((_, i) => ({ id: i + 1 }))
    const handleUpdateMaxNum = async({ id }) => {
      if (id > 3) {
        if (!await dialog.confirm(window.i18n.t('setting__download_max_num_tip'))) return
      }
      updateSetting({ 'download.maxDownloadNum': id })
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
      maxNums,
      handleUpdateMaxNum,
    }
  },
}
</script>

<style lang="less">
dd.cards-row.download-cards-row {
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
    }

    .setting-card-body {
      padding: 10px 16px;
      flex: 1;

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
      }

      .p {
        margin-top: 10px;
      }

      .gap-top.download-path-row {
        display: flex !important;
        flex-flow: row nowrap !important;
        align-items: center;
        gap: 6px;
        width: 100% !important;
        white-space: nowrap;
        margin-top: 10px;

        &:first-child {
          margin-top: 0;
        }

        span.auto-hidden {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block !important;
          min-width: 0;
        }

        .inline-btn {
          margin-top: 0 !important;
          flex-shrink: 0;
          display: inline-block !important;
          min-width: 50px;
          width: auto !important;
          padding: 3px 8px !important;
          font-size: 12px !important;
        }
      }
    }
  }
}
</style>

<style lang="less" module>
.savePath {
  font-size: 12px;
}
.selectWidth {
  width: 60px;
}
</style>
