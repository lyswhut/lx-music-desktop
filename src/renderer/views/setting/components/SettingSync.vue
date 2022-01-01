<template lang="pug">
dt#sync
  | {{$t('setting__sync')}}
  button(class="help-btn" @click="openUrl('https://github.com/lyswhut/lx-music-desktop/blob/master/FAQ.md#%E5%90%8C%E6%AD%A5%E5%8A%9F%E8%83%BD%E7%9A%84%E4%BD%BF%E7%94%A8%E5%AE%9E%E9%AA%8C%E6%80%A7%E9%A6%96%E6%AC%A1%E4%BD%BF%E7%94%A8%E5%89%8D%E5%BB%BA%E8%AE%AE%E5%85%88%E5%A4%87%E4%BB%BD%E4%B8%80%E6%AC%A1%E5%88%97%E8%A1%A8')" :tips="$t('setting__sync_tip')")
    svg-icon(name="help-circle-outline")
dd
  base-checkbox(id="setting_sync_enable" v-model="currentStting.sync.enable" :label="syncEnableTitle")
  div
    p.small {{$t('setting__sync_auth_code', { code: sync.status.code || '' })}}
    p.small {{$t('setting__sync_address', { address: sync.status.address.join(', ') || '' })}}
    p.small {{$t('setting__sync_device', { devices: syncDevices })}}
    p
      base-btn.btn(min :disabled="!sync.status.status" @click="refreshSyncCode") {{$t('setting__sync_refresh_code')}}
dd
  h3#sync_port {{$t('setting__sync_port')}}
  div
    p
      base-input.gap-left(v-model.trim="currentStting.sync.port" :placeholder="$t('setting__sync_port_tip')")
</template>

<script>
import { computed, useI18n, watch } from '@renderer/utils/vueTools'
import { sync } from '@renderer/core/share'
import { refreshSyncCode, syncEnable } from '@renderer/utils/tools'
import { debounce, openUrl } from '@renderer/utils'
import { currentStting } from '../setting'

export default {
  name: 'SettingSync',
  setup() {
    const { t } = useI18n()


    const syncEnableTitle = computed(() => {
      let title = t('setting__sync_enable')
      if (sync.status.message) {
        title += ` [${sync.status.message}]`
      }
      // else if (this.sync.status.address.length) {
      //   // title += ` [${this.sync.status.address.join(', ')}]`
      // }
      return title
    })
    const syncDevices = computed(() => {
      return sync.status.devices.length
        ? sync.status.devices.map(d => `${d.deviceName} (${d.clientId.substring(0, 5)})`).join(', ')
        : ''
    })

    watch(() => currentStting.value.sync.enable, enable => {
      syncEnable({
        enable,
        port: currentStting.value.sync.port,
      })
      sync.enable = enable
    })

    const setPort = debounce(port => {
      syncEnable({
        enable: currentStting.value.sync.enable,
        port,
      })
      sync.port = port
    }, 500)
    watch(() => currentStting.value.sync.port, setPort)


    return {
      currentStting,
      sync,
      syncEnableTitle,
      syncDevices,
      refreshSyncCode,
      openUrl,
    }
  },
}
</script>

<style lang="less" module>
.save-path {
  font-size: 12px;
}
</style>
