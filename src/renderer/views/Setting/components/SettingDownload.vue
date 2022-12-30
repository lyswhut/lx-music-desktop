<template lang="pug">
dt#download {{$t('setting__download')}}
dd
  .gap-top
    base-checkbox(id="setting_download_enable" :modelValue="appSetting['download.enable']" @update:modelValue="updateSetting({'download.enable': $event})" :label="$t('setting__download_enable')")
  .gap-top
    base-checkbox(id="setting_download_skip_exist_file" :modelValue="appSetting['download.skipExistFile']" @update:modelValue="updateSetting({'download.skipExistFile': $event})" :label="$t('setting__download_skip_exist_file')")
dd(:aria-label="$t('setting__download_path_title')")
  h3#download_path {{$t('setting__download_path')}}
  div
    p
      | {{$t('setting__download_path_label')}}
      span.auto-hidden.hover(:class="$style.savePath" @click="openDirInExplorer(appSetting['download.savePath'])" :aria-label="$t('setting__download_path_open_label')") {{appSetting['download.savePath']}}
    p
      base-btn.btn(min @click="handleChangeSavePath") {{$t('setting__download_path_change_btn')}}
dd
  h3#download_use_other_source
    | {{$t('setting__download_use_other_source')}}
    svg-icon(class="help-icon" name="help-circle-outline" :aria-label="$t('setting__download_use_other_source_tip')")
  div
    base-checkbox(id="setting_download_isUseOtherSource" :modelValue="appSetting['download.isUseOtherSource']" @update:modelValue="updateSetting({'download.isUseOtherSource': $event})" :label="$t('setting__is_enable')")
  div
dd(:aria-label="$t('setting__download_name_title')")
  h3#download_name {{$t('setting__download_name')}}
  div
    base-checkbox.gap-left(:id="`setting_download_musicName_${item.value}`" name="setting_download_musicName" :value="item.value" :key="item.value" need
        :modelValue="appSetting['download.fileName']" @update:modelValue="updateSetting({'download.fileName': $event})" v-for="item in musicNames" :label="item.name")
dd
  h3#download_data_embed {{$t('setting__download_data_embed')}}
  .gap-top
    base-checkbox(id="setting_download_isEmbedPic" :modelValue="appSetting['download.isEmbedPic']" @update:modelValue="updateSetting({'download.isEmbedPic': $event})" :label="$t('setting__download_embed_pic')")
  .gap-top
    base-checkbox(id="setting_download_isEmbedLyric" :modelValue="appSetting['download.isEmbedLyric']" @update:modelValue="updateSetting({'download.isEmbedLyric': $event})" :label="$t('setting__download_embed_lyric')")
dd(:aria-label="$t('setting__download_lyric_title')")
  h3#download_lyric {{$t('setting__download_lyric')}}
  .gap-top
    base-checkbox(id="setting_download_isDownloadLrc" :modelValue="appSetting['download.isDownloadLrc']" @update:modelValue="updateSetting({'download.isDownloadLrc': $event})" :label="$t('setting__is_enable')")
  .gap-top
    base-checkbox(id="setting_download_isDownloadTLrc" :disabled="!appSetting['download.isDownloadLrc']" :modelValue="appSetting['download.isDownloadTLrc']" @update:modelValue="updateSetting({'download.isDownloadTLrc': $event})" :label="$t('setting__download_tlyric')")
  .gap-top
    base-checkbox(id="setting_download_isDownloadRLrc" :disabled="!appSetting['download.isDownloadLrc']" :modelValue="appSetting['download.isDownloadRLrc']" @update:modelValue="updateSetting({'download.isDownloadRLrc': $event})" :label="$t('setting__download_rlyric')")
dd
  h3#download_lyric_format {{$t('setting__download_lyric_format')}}
  div
    base-checkbox.gap-left(v-for="item in lrcFormatList" :key="item.id" :id="`setting_download_lrcFormat_${item.id}`"
      name="setting_download_lrcFormat" need :modelValue="appSetting['download.lrcFormat']" @update:modelValue="updateSetting({'download.lrcFormat': $event})" :value="item.id" :label="item.name")
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
      showSelectDialog({
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
.save-path {
  font-size: 12px;
}
</style>
