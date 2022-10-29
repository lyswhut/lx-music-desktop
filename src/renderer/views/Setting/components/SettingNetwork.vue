<template lang="pug">
dt#network {{$t('setting__network')}}
dd
  h3#network_proxy_title {{$t('setting__network_proxy_title')}}
  div
    p
      base-checkbox(id="setting_network_proxy_enable" :modelValue="appSetting['network.proxy.enable']" @update:modelValue="updateSetting({'network.proxy.enable': $event})" :label="$t('setting__is_enable')")
    p
      base-input.gap-left(:modelValue="appSetting['network.proxy.host']" @update:modelValue="setHost" :placeholder="proxy.envProxy ? proxy.envProxy.host : $t('setting__network_proxy_host')")
      base-input.gap-left(:modelValue="appSetting['network.proxy.port']" @update:modelValue="setPort" :placeholder="proxy.envProxy ? proxy.envProxy.port : $t('setting__network_proxy_port')")
    p
      base-input.gap-left(:modelValue="appSetting['network.proxy.username']" @update:modelValue="setUserName" :placeholder="$t('setting__network_proxy_username')")
      base-input.gap-left(:modelValue="appSetting['network.proxy.password']" @update:modelValue="setPassword" type="password" :placeholder="$t('setting__network_proxy_password')")

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
    const setUserName = debounce(username => {
      updateSetting({ 'network.proxy.username': username.trim() })
    }, 500)
    const setPassword = debounce(password => {
      updateSetting({ 'network.proxy.password': password.trim() })
    }, 500)

    onBeforeUnmount(() => {
      if (appSetting['network.proxy.enable'] && !appSetting['network.proxy.host']) proxy.enable = false
    })

    return {
      appSetting,
      updateSetting,
      setHost,
      setPort,
      setUserName,
      setPassword,
      proxy,
    }
  },
}
</script>
