<template lang="pug">
dt#update {{$t('setting__update')}}
dd
  p.small
    | {{$t('setting__update_latest_label')}}{{versionInfo.newVersion ? versionInfo.newVersion.version : $t('setting__update_unknown')}}
  p.small(@click="handleOPenDevTools") {{$t('setting__update_current_label')}}{{versionInfo.version}}
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
import { computed } from '@common/utils/vueTools'
import { versionInfo } from '@renderer/store'
import { sizeFormate } from '@common/utils/common'
// import { openDirInExplorer, selectDir } from '@renderer/utils'
import { openDevTools } from '@renderer/utils/ipc'
import { useI18n } from '@renderer/plugins/i18n'

export default {
  name: 'SettingUpdate',
  setup() {
    let lastClickTime = 0
    let clickNum = 0

    const t = useI18n()

    const handleOPenDevTools = () => {
      if (window.performance.now() - lastClickTime > 1000) {
        if (clickNum > 0) clickNum = 0
      } else {
        if (clickNum > 4) {
          openDevTools()
          clickNum = 0
          return
        }
      }
      clickNum++
      lastClickTime = window.performance.now()
    }

    const downloadProgress = computed(() => {
      return versionInfo.downloadProgress
        ? `${versionInfo.downloadProgress.percent.toFixed(2)}% - ${sizeFormate(versionInfo.downloadProgress.transferred)}/${sizeFormate(versionInfo.downloadProgress.total)} - ${sizeFormate(versionInfo.downloadProgress.bytesPerSecond)}/s`
        : t('setting__update_init')
    })

    const showUpdateModal = () => {
      versionInfo.showModal = true
    }

    return {
      versionInfo,
      downloadProgress,
      handleOPenDevTools,
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
