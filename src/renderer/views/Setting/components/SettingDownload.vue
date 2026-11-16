<template lang="pug">
dt#download {{ $t('setting__download') }}
dd
  div(:class="$style.cardRow")
    div(:class="[$style.sectionCard, $style.wideCard]")
      h3#download_options(:class="$style.sectionCardTitle") {{ $t('setting__download_options') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(id="setting_download_enable" :model-value="appSetting['download.enable']" :label="$t('setting__download_enable')" @update:model-value="updateSetting({'download.enable': $event})")
        .gap-top
          base-checkbox(id="setting_download_skip_exist_file" :model-value="appSetting['download.skipExistFile']" :label="$t('setting__download_skip_exist_file')" @update:model-value="updateSetting({'download.skipExistFile': $event})")
        .gap-top
          base-checkbox(id="setting_download_save_group_list_name" :model-value="appSetting['download.isSavePathGroupByListName']" :label="$t('setting_download_save_group_list_name')" @update:model-value="updateSetting({'download.isSavePathGroupByListName': $event})")
    div(:class="[$style.sectionCard, $style.wideCard]")
      h3#download_path(:class="$style.sectionCardTitle") {{ $t('setting__download_path') }}
      div(:class="$style.sectionCardBody")
        .p(:class="$style.pathRow")
          span(:class="$style.pathLabel") {{ $t('setting__download_path_label') }}
          span.auto-hidden.hover(:class="$style.savePath" :aria-label="$t('setting__download_path_open_label')" @click="openDirInExplorer(appSetting['download.savePath'])") {{ appSetting['download.savePath'] }}
          base-btn.btn(min @click="handleChangeSavePath") {{ $t('setting__download_path_change_btn') }}
    div(:class="$style.sectionCard")
      h3#download_max_num(:class="$style.sectionCardTitle")
        | {{ $t('setting__download_max_num') }}
        svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__download_max_num_tooltip')")
      div(:class="$style.sectionCardBody")
        base-selection(:class="$style.selectWidth" :model-value="appSetting['download.maxDownloadNum']" :list="maxNums" item-key="id" item-name="id" @change="handleUpdateMaxNum")
    div(:class="$style.sectionCard")
      h3#download_use_other_source(:class="$style.sectionCardTitle")
        | {{ $t('setting__download_use_other_source') }}
        svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__download_use_other_source_tip')")
      div(:class="$style.sectionCardBody")
        base-checkbox(id="setting_download_isUseOtherSource" :model-value="appSetting['download.isUseOtherSource']" :label="$t('setting__is_enable')" @update:model-value="updateSetting({'download.isUseOtherSource': $event})")

dd
  div(:class="$style.cardRow")
    div(:class="[$style.sectionCard, $style.wideCard]")
      h3#download_data_embed(:class="$style.sectionCardTitle") {{ $t('setting__download_data_embed') }}
      div(:class="$style.sectionCardBody")
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
    div(:class="$style.sectionCard")
      h3#download_name(:class="$style.sectionCardTitle") {{ $t('setting__download_name') }}
      div(:class="$style.sectionCardBody")
        .gap-top(v-for="item in musicNames" :key="item.value")
          base-checkbox(
            :id="`setting_download_musicName_${item.value}`" name="setting_download_musicName" :value="item.value"
            need :model-value="appSetting['download.fileName']" :label="item.name" @update:model-value="updateSetting({'download.fileName': $event})")
dd
  div(:class="$style.cardRow")
    div(:class="[$style.sectionCard, $style.wideCard]")
      h3#download_lyric(:class="$style.sectionCardTitle") {{ $t('setting__download_lyric') }}
      div(:class="$style.sectionCardBody")
        .gap-top
          base-checkbox(id="setting_download_isDownloadLrc" :model-value="appSetting['download.isDownloadLrc']" :label="$t('setting__is_enable')" @update:model-value="updateSetting({'download.isDownloadLrc': $event})")
        .gap-top
          base-checkbox(id="setting_download_isDownloadTLrc" :disabled="!appSetting['download.isDownloadLrc']" :model-value="appSetting['download.isDownloadTLrc']" :label="$t('setting__download_tlyric')" @update:model-value="updateSetting({'download.isDownloadTLrc': $event})")
        .gap-top
          base-checkbox(id="setting_download_isDownloadRLrc" :disabled="!appSetting['download.isDownloadLrc']" :model-value="appSetting['download.isDownloadRLrc']" :label="$t('setting__download_rlyric')" @update:model-value="updateSetting({'download.isDownloadRLrc': $event})")
        .gap-top
          base-checkbox(id="setting_download_isDownloadLxLrc" :disabled="!appSetting['download.isDownloadLrc']" :model-value="appSetting['download.isDownloadLxLrc']" :label="$t('setting__download_lxlyric')" @update:model-value="updateSetting({'download.isDownloadLxLrc': $event})")
    div(:class="$style.sectionCard")
      h3#download_lyric_format(:class="$style.sectionCardTitle")
        | {{ $t('setting__download_lyric_format') }}
        svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__download_lyric_format_tip')")
      div(:class="$style.sectionCardBody")
        .gap-top(v-for="item in lrcFormatList" :key="item.id")
          base-checkbox(
            :id="`setting_download_lrcFormat_${item.id}`" name="setting_download_lrcFormat" need :model-value="appSetting['download.lrcFormat']" :value="item.id" :label="item.name"
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

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

// .savePath {
//   font-size: 12px;
// }
.selectWidth {
  width: 60px;
}

.sectionCard {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-primary-light-300-alpha-700);
}

.sectionCardTitle {
  margin: 0;
  padding: 8px 12px;
  font-size: 13px;
  background-color: var(--color-primary-light-200-alpha-600);
}

.sectionCardBody {
  padding: 12px;

  :global {
    .base-selection {
      width: 100%;
    }
  }
}

.cardRow {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
  align-items: stretch;
}

// 卡片行中的加宽卡片（跨两列）
.wideCard {
  grid-column: span 2;
}

// 下载路径：标签/路径/更改按钮 一行显示
.pathRow {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 10px;

  .pathLabel {
    flex: none;
  }

  .savePath {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
