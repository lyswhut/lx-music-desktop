<template lang="pug">
dt#network {{ $t('setting__network') }}
dd
  h3#network_proxy_title {{ $t('setting__network_proxy_title') }}
  div
    .p
      base-checkbox(id="setting_network_proxy_enable" :model-value="appSetting['network.proxy.enable']" :label="$t('setting__is_enable')" @update:model-value="updateSetting({'network.proxy.enable': $event})")
    .p
      base-input(:model-value="appSetting['network.proxy.host']" :placeholder="proxy.envProxy ? proxy.envProxy.host : $t('setting__network_proxy_host')" @update:model-value="setHost")
    .p
      base-input(:model-value="appSetting['network.proxy.port']" :placeholder="proxy.envProxy ? proxy.envProxy.port : $t('setting__network_proxy_port')" @update:model-value="setPort")

</template>

<script>
import { onBeforeUnmount } from '@common/utils/vueTools'
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

    onBeforeUnmount(() => {
      if (appSetting['network.proxy.enable'] && !appSetting['network.proxy.host']) proxy.enable = false
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
