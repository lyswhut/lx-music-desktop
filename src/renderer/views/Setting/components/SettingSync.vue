<template lang="pug">
dt#sync
  | {{ $t('setting__sync') }}
  button(class="help-btn" :aria-label="$t('setting__sync_tip')" @click="openUrl('https://lyswhut.github.io/lx-music-doc/desktop/faq/sync')")
    svg-icon(name="help-circle-outline")
dd
  base-checkbox(id="setting_sync_enable" :model-value="appSetting['sync.enable']" :label="$t('setting__sync_enable')" @update:model-value="updateSetting({ 'sync.enable': $event })")

dd
  h3#sync_mode {{ $t('setting__sync_mode') }}
  div
    base-checkbox.gap-left(id="setting_sync_mode_server" :disabled="sync.enable" :model-value="appSetting['sync.mode']" need value="server" :label="$t('setting__sync_mode_server')" @update:model-value="updateSetting({ 'sync.mode': $event })")
    base-checkbox.gap-left(id="setting_sync_mode_client" :disabled="sync.enable" :model-value="appSetting['sync.mode']" need value="client" :label="$t('setting__sync_mode_client')" @update:model-value="updateSetting({ 'sync.mode': $event })")


dd(v-if="sync.mode == 'client'")
  h3 {{ $t('setting__sync_client_mode') }}
  div
    .p.small {{ $t('setting__sync_client_status', { status: clientStatus }) }}
    .p.small {{ $t('setting__sync_client_address', { address: sync.client.status.address.join(', ') || '' }) }}
    .p
      .p.small {{ $t('setting__sync_client_host') }}
      div
        base-input.gap-left(:class="$style.hostInput" :model-value="appSetting['sync.client.host']" :disabled="sync.enable" :placeholder="$t('setting__sync_client_host_tip')" @update:model-value="setSyncClientHost")
dd(v-else)
  h3 {{ syncEnableServerTitle }}
  div
    .p.small {{ $t('setting__sync_server_auth_code', { code: sync.server.status.code || '' }) }}
    .p.small {{ $t('setting__sync_server_address', { address: sync.server.status.address.join(', ') || '' }) }}
    .p.small {{ $t('setting__sync_server_device', { devices: syncDevices }) }}
    .p
      base-btn.btn(min :disabled="!sync.server.status.status" @click="refreshSyncCode") {{ $t('setting__sync_server_refresh_code') }}
    .p
      .p.small {{ $t('setting__sync_server_port') }}
      div
        base-input.gap-left(:class="$style.portInput" :model-value="appSetting['sync.server.port']" :disabled="sync.enable" type="number" :placeholder="$t('setting__sync_server_port_tip')" @update:model-value="setSyncServerPort")


</template>

<script>
import { computed } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { sendSyncAction } from '@renderer/utils/ipc'
import { openUrl } from '@common/utils/electron'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { debounce } from '@common/utils/common'
import { SYNC_CODE } from '@common/constants'

export default {
  name: 'SettingSync',
  setup() {
    const t = useI18n()


    const syncEnableServerTitle = computed(() => {
      let title = t('setting__sync_server_mode')
      if (sync.server.status.message) {
        title += ` [${sync.server.status.message}]`
      }
      // else if (this.sync.server.status.address.length) {
      //   // title += ` [${this.sync.server.status.address.join(', ')}]`
      // }
      return title
    })

    const clientStatus = computed(() => {
      let status
      switch (sync.client.status.message) {
        case SYNC_CODE.msgBlockedIp:
          status = t('setting__sync_code_blocked_ip')
          break
        case SYNC_CODE.authFailed:
          status = t('setting__sync_code_fail')
          break
        default:
          status = sync.client.status.message
            ? sync.client.status.message
            : sync.client.status.status
              ? t('setting_sync_status_enabled')
              : t('sync_status_disabled')
          break
      }
      return status
    })
    const syncDevices = computed(() => {
      return sync.server.status.devices.length
        ? sync.server.status.devices.map(d => `${d.deviceName} (${d.clientId.substring(0, 5)})`).join(', ')
        : ''
    })

    const refreshSyncCode = () => {
      sendSyncAction({ action: 'generate_code' })
    }

    const setSyncServerPort = debounce(port => {
      updateSetting({ 'sync.server.port': port.trim() })
    }, 500)

    const setSyncClientHost = debounce(host => {
      updateSetting({ 'sync.client.host': host.trim() })
    }, 500)


    return {
      appSetting,
      updateSetting,
      sync,
      syncEnableServerTitle,
      setSyncServerPort,
      setSyncClientHost,
      syncDevices,
      refreshSyncCode,
      clientStatus,
      openUrl,
    }
  },
}
</script>

<style lang="less" module>
.save-path {
  font-size: 12px;
}

.portInput[disabled], .hostInput[disabled] {
  opacity: .8 !important;
}

.hostInput {
  min-width: 380px;
}
</style>
