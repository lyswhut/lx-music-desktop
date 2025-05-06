<template lang="pug">
dt#network {{ $t('setting__network') }}
dd
  h3#network_proxy_title {{ $t('setting__network_proxy_title') }}
  div
    .p
      base-checkbox.gap-left(id="setting_network_proxy_type_disable" key="disable" value="disable" need :model-value="appSetting['network.proxy.type']" :label="$t('setting__network_proxy_type_disable')" @update:model-value="updateSetting({'network.proxy.type': 'disable'})")
      base-checkbox.gap-left(id="setting_network_proxy_type_system" key="system" value="system" need :model-value="appSetting['network.proxy.type']" :label="$t('setting__network_proxy_type_system')" @update:model-value="updateSetting({'network.proxy.type': 'system'})")
      base-checkbox.gap-left(id="setting_network_proxy_type_custom" key="custom" value="custom" need :model-value="appSetting['network.proxy.type']" :label="$t('setting__network_proxy_type_custom')" @update:model-value="updateSetting({'network.proxy.type': 'custom'})")
    .p(v-if="appSetting['network.proxy.type'] == 'custom'")
      .p
        base-input(:model-value="appSetting['network.proxy.host']" :placeholder="proxy.envProxy ? proxy.envProxy.host : $t('setting__network_proxy_host')" @update:model-value="setHost")
      .p
        base-input(:model-value="appSetting['network.proxy.port']" :placeholder="proxy.envProxy ? proxy.envProxy.port : $t('setting__network_proxy_port')" @update:model-value="setPort")
</template>

<script>
import { onMounted, onBeforeUnmount } from '@common/utils/vueTools'
import { proxy } from '@renderer/store'
import { debounce } from '@common/utils'

import { appSetting, updateSetting } from '@renderer/store/setting'

export default {
  name: 'SettingNetwork',
  setup() {
    const setHost = debounce(host => {
      updateSetting({ 'network.proxy.host': host.trim() })
    }, 500)
    const setPort = debounce(port => {
      updateSetting({ 'network.proxy.port': port.trim() })
    }, 500)

    let prevProxyType
    onMounted(() => {
      prevProxyType = appSetting['network.proxy.type']
    })
    onBeforeUnmount(() => {
      if (appSetting['network.proxy.type'] === 'custom' && !appSetting['network.proxy.host']) {
        if (prevProxyType && prevProxyType != 'custom') updateSetting({ 'network.proxy.type': prevProxyType })
        else updateSetting({ 'network.proxy.type': 'system' })
      }
    })

    return {
      appSetting,
      updateSetting,
      setHost,
      setPort,
      proxy,
    }
  },
}
</script>
