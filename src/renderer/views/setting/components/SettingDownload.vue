<template lang="pug">
dt#download {{$t('setting__download')}}
dd
  base-checkbox(id="setting_download_enable" v-model="currentStting.download.enable" :label="$t('setting__download_enable')")
dd(:tips="$t('setting__download_path_title')")
  h3#download_path {{$t('setting__download_path')}}
  div
    p
      | {{$t('setting__download_path_label')}}
      span.auto-hidden.hover(:class="$style.savePath" @click="openDirInExplorer(currentStting.download.savePath)" :tips="$t('setting__download_path_open_label')") {{currentStting.download.savePath}}
    p
      base-btn.btn(min @click="handleChangeSavePath") {{$t('setting__download_path_change_btn')}}
dd
  h3#download_use_other_source
    | {{$t('setting__download_use_other_source')}}
    svg-icon(class="help-icon" name="help-circle-outline" :tips="$t('setting__download_use_other_source_tip')")
  div
    base-checkbox(id="setting_download_isUseOtherSource" v-model="currentStting.download.isUseOtherSource" :label="$t('setting__is_enable')")
  div
dd(:tips="$t('setting__download_name_title')")
  h3#download_name {{$t('setting__download_name')}}
  div
    base-checkbox.gap-left(:id="`setting_download_musicName_${item.value}`" name="setting_download_musicName" :value="item.value" :key="item.value" need
        v-model="currentStting.download.fileName" v-for="item in musicNames" :label="item.name")
dd
  h3#download_data_embed {{$t('setting__download_data_embed')}}
  .gap-top
    base-checkbox(id="setting_download_isEmbedPic" v-model="currentStting.download.isEmbedPic" :label="$t('setting__download_embed_pic')")
  .gap-top
    base-checkbox(id="setting_download_isEmbedLyric" v-model="currentStting.download.isEmbedLyric" :label="$t('setting__download_embed_lyric')")
dd(:tips="$t('setting__download_lyric_title')")
  h3#download_lyric {{$t('setting__download_lyric')}}
  div
    base-checkbox(id="setting_download_isDownloadLrc" v-model="currentStting.download.isDownloadLrc" :label="$t('setting__is_enable')")
dd
  h3#download_lyric_format {{$t('setting__download_lyric_format')}}
  div
    base-checkbox.gap-left(v-for="item in lrcFormatList" :key="item.id" :id="`setting_download_lrcFormat_${item.id}`"
      name="setting_download_lrcFormat" need v-model="currentStting.download.lrcFormat" :value="item.id" :label="item.name")
</template>

<script>
import { computed, useI18n } from '@renderer/utils/vueTools'
// import { getSystemFonts } from '@renderer/utils/tools'
import { openDirInExplorer, selectDir } from '@renderer/utils'
import { currentStting } from '../setting'

export default {
  name: 'SettingDownload',
  setup() {
    const { t } = useI18n()

    const handleChangeSavePath = () => {
      selectDir({
        title: t('setting__download_select_save_path'),
        defaultPath: currentStting.value.download.savePath,
        properties: ['openDirectory'],
      }).then(result => {
        if (result.canceled) return
        currentStting.value.download.savePath = result.filePaths[0]
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
      currentStting,
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
