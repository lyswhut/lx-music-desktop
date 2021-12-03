<template lang="pug">
dt#network {{$t('setting__network')}}
dd
  h3#network_proxy_title {{$t('setting__network_proxy_title')}}
  div
    p
      base-checkbox(id="setting_network_proxy_enable" v-model="currentStting.network.proxy.enable" :label="$t('setting__is_enable')")
    p
      base-input.gap-left(v-model.trim="currentStting.network.proxy.host" :placeholder="$t('setting__network_proxy_host')")
      base-input.gap-left(v-model.trim="currentStting.network.proxy.port" :placeholder="$t('setting__network_proxy_port')")
    p
      base-input.gap-left(v-model.trim="currentStting.network.proxy.username" :placeholder="$t('setting__network_proxy_username')")
      base-input.gap-left(v-model.trim="currentStting.network.proxy.password" type="password" :placeholder="$t('setting__network_proxy_password')")

</template>

<script>
import { watch, onBeforeUnmount } from '@renderer/utils/vueTools'
import { proxy } from '@renderer/core/share'
import { debounce } from '@renderer/utils'

import { currentStting } from '../setting'

export default {
  name: 'SettingNetwork',
  setup() {
    watch(() => currentStting.value.network.proxy.enable, enable => {
      proxy.enable = enable
    })

    const setHost = debounce(host => {
      proxy.host = host
    }, 500)
    watch(() => currentStting.value.network.proxy.host, setHost)
    const setPort = debounce(port => {
      proxy.port = port
    }, 500)
    watch(() => currentStting.value.network.proxy.port, setPort)
    const setUserName = debounce(username => {
      proxy.username = username
    }, 500)
    watch(() => currentStting.value.network.proxy.username, setUserName)
    const setPassword = debounce(password => {
      proxy.password = password
    }, 500)
    watch(() => currentStting.value.network.proxy.password, setPassword)

    onBeforeUnmount(() => {
      if (currentStting.value.network.proxy.enable && !currentStting.value.network.proxy.host) proxy.enable = false
    })

    return {
      currentStting,
    }
  },
}
</script>
