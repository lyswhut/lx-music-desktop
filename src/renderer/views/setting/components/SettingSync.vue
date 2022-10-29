<template lang="pug">
dt#sync
  | {{$t('setting__sync')}}
  button(class="help-btn" @click="openUrl('https://lyswhut.github.io/lx-music-doc/desktop/faq/sync')" :aria-label="$t('setting__sync_tip')")
    svg-icon(name="help-circle-outline")
dd
  base-checkbox(id="setting_sync_enable" :modelValue="appSetting['sync.enable']" @update:modelValue="updateSetting({ 'sync.enable': $event })" :label="syncEnableTitle")
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
      base-input.gap-left(:modelValue="appSetting['sync.port']" @update:modelValue="setSyncPort" :placeholder="$t('setting__sync_port_tip')")
</template>

<script>
import { computed } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { sendSyncAction } from '@renderer/utils/ipc'
import { openUrl } from '@common/utils/electron'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { debounce } from '@common/utils/common'

export default {
  name: 'SettingSync',
  setup() {
    const t = useI18n()


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

    const refreshSyncCode = () => {
      sendSyncAction({ action: 'generate_code' })
    }

    const setSyncPort = debounce(port => {
      updateSetting({ 'sync.port': port.trim() })
    }, 500)


    return {
      appSetting,
      updateSetting,
      sync,
      syncEnableTitle,
      setSyncPort,
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
