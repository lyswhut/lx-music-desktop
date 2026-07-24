<template lang="pug">
dt#network {{ $t('setting__network') }}
dd
  div.setting-card.setting-card-full
    .setting-card-header {{ $t('setting__network_proxy_title') }}
    .setting-card-body
      .gap-top
        base-checkbox(id="setting_network_proxy_enable" :model-value="appSetting['network.proxy.enable']" :label="$t('setting__is_enable')" @update:model-value="updateSetting({'network.proxy.enable': $event})")
      .gap-top
        base-input(:model-value="appSetting['network.proxy.host']" :placeholder="proxy.envProxy ? proxy.envProxy.host : $t('setting__network_proxy_host')" @update:model-value="setHost")
      .gap-top
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

<style lang="less">
.setting-card {
  display: block;
  box-sizing: border-box;
  background-color: rgba(77, 175, 124, 0.12);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(77, 175, 124, 0.25);
  overflow: hidden;
  margin: 0 0 10px;
  max-width: 420px;
}
.setting-card-full {
  display: block;
  max-width: none !important;
  width: 100%;
  margin-bottom: 5px;
}
.setting-card-header {
  padding: 8px 16px;
  font-weight: bold;
  font-size: 13px;
  color: var(--color-primary);
  border-bottom: 1px solid rgba(77, 175, 124, 0.25);
}
.setting-card-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}
</style>
