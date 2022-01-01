<template lang="pug">
dt#update {{$t('setting__update')}}
dd
  p.small
    | {{$t('setting__update_latest_label')}}{{versionInfo.newVersion ? versionInfo.newVersion.version : $t('setting__update_unknown')}}
  p.small {{$t('setting__update_current_label')}}{{versionInfo.version}}
  p.small(v-if="versionInfo.downloadProgress" style="line-height: 1.5;")
    | {{$t('setting__update_downloading')}}
    br
    | {{$t('setting__update_progress')}}{{downloadProgress}}
  p(v-if="versionInfo.newVersion")
    span(v-if="versionInfo.isLatestVer") {{$t('setting__update_latest')}}
    base-btn.btn.gap-left(v-else min @click="showUpdateModal") {{$t('setting__update_open_version_modal_btn')}}
  p.small(v-else) {{$t('setting__update_checking')}}
</template>

<script>
import { computed, useI18n } from '@renderer/utils/vueTools'
import { versionInfo } from '@renderer/core/share'
import { sizeFormate } from '@renderer/utils/tools'
// import { openDirInExplorer, selectDir } from '@renderer/utils'
import { currentStting } from '../setting'

export default {
  name: 'SettingUpdate',
  setup() {
    const { t } = useI18n()

    const downloadProgress = computed(() => {
      return versionInfo.downloadProgress
        ? `${versionInfo.downloadProgress.percent.toFixed(2)}% - ${sizeFormate(versionInfo.downloadProgress.transferred)}/${sizeFormate(versionInfo.downloadProgress.total)} - ${sizeFormate(versionInfo.downloadProgress.bytesPerSecond)}/s`
        : t('setting__update_init')
    })

    const showUpdateModal = () => {
      versionInfo.showModal = true
    }

    return {
      currentStting,
      versionInfo,
      downloadProgress,
      showUpdateModal,
    }
  },
}
</script>

<style lang="less" module>
.save-path {
  font-size: 12px;
}
</style>
