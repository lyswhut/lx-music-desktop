<template lang="pug">
dd
  h3 {{ syncEnableServerTitle }}
  div
    .p.small {{ $t('setting__sync_server_auth_code', { code: sync.server.status.code || '' }) }}
    .p.small {{ $t('setting__sync_server_address', { address: sync.server.status.address.join(', ') || '' }) }}
    .p.small {{ $t('setting__sync_server_device', { devices: syncDevices }) }}
    .p.gap-top
      .p.small {{ $t('setting__sync_server_port') }}
      div
        base-input.gap-left(:class="$style.portInput" :model-value="appSetting['sync.server.port']" :disabled="sync.enable" type="number" :placeholder="$t('setting__sync_server_port_tip')" @update:model-value="setSyncServerPort")

    .p.gap-top
      base-btn.btn(min :disabled="!sync.server.status.status" @click="refreshSyncCode") {{ $t('setting__sync_server_refresh_code') }}
      base-btn.btn(min @click="isShowDeviceListModal = true") {{ $t('setting__sync_server_show_device_list') }}
  ServerDeviceListModal(v-model="isShowDeviceListModal")
</template>

<script>
import { computed, ref } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { sendSyncAction } from '@renderer/utils/ipc'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { debounce } from '@common/utils/common'
import ServerDeviceListModal from './ServerDeviceListModal.vue'

export default {
  name: 'SettingSyncServer',
  components: {
    ServerDeviceListModal,
  },
  setup() {
    const t = useI18n()
    const isShowDeviceListModal = ref(false)

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

    const syncDevices = computed(() => {
      return sync.server.status.devices.length
        ? sync.server.status.devices.map(d => `${d.deviceName} (${d.clientId.substring(0, 5)})`).join(', ')
        : ''
    })

    const refreshSyncCode = () => {
      void sendSyncAction({ action: 'generate_code' })
    }

    const setSyncServerPort = debounce(port => {
      updateSetting({ 'sync.server.port': port.trim() })
    }, 500)

    return {
      appSetting,
      sync,
      syncEnableServerTitle,
      setSyncServerPort,
      syncDevices,
      refreshSyncCode,
      isShowDeviceListModal,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.portInput[disabled], .hostInput[disabled] {
  opacity: .8 !important;
}

.hostInput {
  min-width: 380px;
}


.list {
  // background-color: @color-search-form-background;
  font-size: 13px;
  transition-property: height;
  position: relative;
  .listItem {
    position: relative;
    padding: 15px 10px 15px 15px;
    transition: .3s ease;
    transition-property: background-color, opacity;
    line-height: 1.3;
    // overflow: hidden;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;

    &:hover {
      background-color: var(--color-primary-background-hover);
    }
    // border-radius: 4px;
    // &:last-child {
    //   border-bottom-left-radius: 4px;
    //   border-bottom-right-radius: 4px;
    // }
    &.fetching {
      opacity: .5;
    }
  }
}

.listLeft {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
}

.text {
  flex: auto;
  margin-bottom: 2px;
  .mixin-ellipsis-1;
}

.label {
  flex: none;
  font-size: 12px;
  opacity: 0.5;
  // padding: 0 10px;
  // display: flex;
  // align-items: center;
  // transform: rotate(45deg);
  // background-color:
}
.btns {
  flex: none;
  font-size: 12px;
  padding: 0 5px;
  display: flex;
  align-items: center;
}
.btn {
  background-color: transparent;
  border: none;
  border-radius: @form-radius;
  margin-right: 5px;
  cursor: pointer;
  padding: 4px 7px;
  color: var(--color-button-font);
  outline: none;
  transition: background-color 0.2s ease;
  line-height: 0;
  &:last-child {
    margin-right: 0;
  }

  svg {
    height: 22px;
    width: 22px;
  }

  &:hover {
    background-color: var(--color-primary-background-hover);
  }
  &:active {
    background-color: var(--color-primary-font-active);
  }
}

</style>
