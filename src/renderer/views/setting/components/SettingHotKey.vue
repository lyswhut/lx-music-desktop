<template lang="pug">
dt#hot_key {{$t('setting__hot_key')}}
dd
  h3#hot_key_local_title {{$t('setting__hot_key_local_title')}}
  div
    base-checkbox(id="setting_download_hotKeyLocal" v-model="current_hot_key.local.enable" :label="$t('setting__is_enable')" @change="handleHotKeySaveConfig")
  div(:class="$style.hotKeyContainer" :style="{ opacity: current_hot_key.local.enable ? 1 : .6 }")
    div(:class="$style.hotKeyItem" v-for="item in allHotKeys.local")
      h4(:class="$style.hotKeyItemTitle") {{$t('setting__hot_key_' + item.name)}}
      base-input(:class="$style.hotKeyItemInput" readonly @keyup.prevent :placeholder="$t('setting__hot_key_unset_input')"
        :value="hotKeyConfig.local[item.name] && formatHotKeyName(hotKeyConfig.local[item.name].key)"
        @focus="handleHotKeyFocus($event, item, 'local')"
        @blur="handleHotKeyBlur($event, item, 'local')")
dd
  h3#hot_key_global_title {{$t('setting__hot_key_global_title')}}
  div
    base-checkbox(id="setting_download_hotKeyGlobal" v-model="current_hot_key.global.enable" :label="$t('setting__is_enable')" @change="handleEnableHotKey")
  div(:class="$style.hotKeyContainer" :style="{ opacity: current_hot_key.global.enable ? 1 : .6 }")
    div(:class="$style.hotKeyItem" v-for="item in allHotKeys.global")
      h4(:class="$style.hotKeyItemTitle") {{$t('setting__hot_key_' + item.name)}}
      base-input(:class="[$style.hotKeyItemInput, hotKeyConfig.global[item.name] && hotKeyStatus[hotKeyConfig.global[item.name].key] && hotKeyStatus[hotKeyConfig.global[item.name].key].status === false ? $style.hotKeyFailed : null]"
        :value="hotKeyConfig.global[item.name] && formatHotKeyName(hotKeyConfig.global[item.name].key)" @input.prevent readonly :placeholder="$t('setting__hot_key_unset_input')"
        @focus="handleHotKeyFocus($event, item, 'global')"
        @blur="handleHotKeyBlur($event, item, 'global')")
</template>

<script>
import { ref, useI18n, onBeforeUnmount, toRaw } from '@renderer/utils/vueTools'
import { allHotKeys, hotKeySetEnable, hotKeySetConfig, hotKeyGetStatus } from '@renderer/utils/tools'
import { isMac } from '@common/utils'
import { base as eventBaseName } from '@renderer/event/names'
import { mainWindow as eventsNameMainWindow } from '@main/events/_name'

import { currentStting } from '../setting'

const formatHotKeyName = (name) => {
  if (name.includes('arrow')) {
    name = name.replace(/arrow(left|right|up|down)/, s => {
      switch (s) {
        case 'arrowleft': return '←'
        case 'arrowright': return '→'
        case 'arrowup': return '↑'
        case 'arrowdown': return '↓'
      }
    })
  }
  if (name.includes('mod')) name = name.replace('mod', isMac ? 'Command' : 'Ctrl')
  name = name.replace(/(\+|^)[a-z]/g, l => l.toUpperCase())
  if (name.length > 1) name = name.replace(/\+/g, ' + ')
  return name
}

export default {
  name: 'SettingHotKey',
  setup() {
    const { t } = useI18n()
    const current_hot_key = ref({
      local: {
        enable: false,
        keys: {},
      },
      global: {
        enable: false,
        keys: {},
      },
    })

    const hotKeyConfig = ref({
      local: {},
      global: {},
    })

    const hotKeyStatus = ref({})
    let isEditHotKey = false
    let hotKeyTargetInput
    let newHotKey

    const initHotKeyConfig = () => {
      let config = {}
      for (const [type, typeInfo] of Object.entries(current_hot_key.value)) {
        let configInfo = config[type] = {}
        for (const [key, info] of Object.entries(typeInfo.keys)) {
          if (info.name == null) continue
          configInfo[info.name] = {
            key,
            info,
          }
        }
      }
      hotKeyConfig.value = config
    }

    const handleHotKeyFocus = (event, info, type) => {
      setTimeout(async() => {
        await hotKeySetEnable(false)
        window.isEditingHotKey = true
        isEditHotKey = true
        let config = hotKeyConfig.value[type][info.name]
        newHotKey = config?.key
        hotKeyTargetInput = event.target
        event.target.value = t('setting__hot_key_tip_input')
      })
    }

    const handleHotKeyBlur = (event, info, type) => {
      setTimeout(async() => {
        await hotKeySetEnable(true)
        window.isEditingHotKey = false
        isEditHotKey = false
        const prevInput = hotKeyTargetInput
        hotKeyTargetInput = null
        if (prevInput?.value == t('setting__hot_key_tip_input')) {
          prevInput.value = newHotKey ? formatHotKeyName(newHotKey) : ''
          return
        }
        let config = hotKeyConfig.value[type][info.name]
        let originKey
        if (type == 'global' && newHotKey && current_hot_key.value.global.enable) {
          try {
            await hotKeySetConfig({
              action: 'register',
              data: {
                key: newHotKey,
                info,
              },
            })
          } catch (error) {
            console.log(error)
            return
          }
        }
        if (config) {
          if (config.key == newHotKey) return
          originKey = config.key
          delete current_hot_key.value[type].keys[config.key]
        } else if (!newHotKey) return

        if (newHotKey) {
          for (const [tempType, tempInfo] of Object.entries(current_hot_key.value)) {
            if (tempType == type) continue
            config = tempInfo.keys[newHotKey]
            if (config) {
              console.log(newHotKey, info, config, info.name, config.name)
              delete current_hot_key.value[tempType].keys[newHotKey]
              break
            }
          }
          current_hot_key.value[type].keys[newHotKey] = info
        }

        initHotKeyConfig()
        // console.log(this.current_hot_key.global.keys)
        if (originKey && current_hot_key.value.global.enable) {
          try {
            await hotKeySetConfig({
              action: 'unregister',
              data: originKey,
            })
          } catch (error) {
            console.log(error)
          }
        }
        await handleHotKeySaveConfig()
        await getHotKeyStatus()
      })
    }

    const handleKeyDown = ({ event, keys, key, type }) => {
      // if (!event || event.repeat) return
      if (!event || event.repeat || type == 'up' || !isEditHotKey) return
      event.preventDefault()
      // console.log(event, key)
      switch (key) {
        case 'delete':
        case 'backspace':
          key = ''
          break
      }
      hotKeyTargetInput.value = formatHotKeyName(key)
      // console.log(keys, key, type)
      newHotKey = key
    }
    const handleUpdateHotKeyConfig = (config) => {
      // console.log(config)
      for (const [type, info] of Object.entries(config)) {
        current_hot_key.value[type] = info
      }
    }
    const handleHotKeySaveConfig = async() => {
      // console.log(this.current_hot_key)
      window.appHotKeyConfig = current_hot_key.value
      await hotKeySetConfig({
        action: 'config',
        data: toRaw(current_hot_key.value),
        source: eventsNameMainWindow.name,
      })
    }
    const handleEnableHotKey = async() => {
      await hotKeySetConfig({
        action: 'enable',
        data: current_hot_key.value.global.enable,
        source: eventsNameMainWindow.name,
      })
      await handleHotKeySaveConfig()
      await getHotKeyStatus()
    }
    const getHotKeyStatus = () => {
      return hotKeyGetStatus().then(status => {
        // console.log(status)
        hotKeyStatus.value = status
        return status
      })
    }

    current_hot_key.value = window.appHotKeyConfig
    initHotKeyConfig()
    getHotKeyStatus()

    window.eventHub.on(eventBaseName.set_hot_key_config, handleUpdateHotKeyConfig)
    window.eventHub.on(eventBaseName.key_down, handleKeyDown)

    onBeforeUnmount(() => {
      window.eventHub.off(eventBaseName.set_hot_key_config, handleUpdateHotKeyConfig)
      window.eventHub.off(eventBaseName.key_down, handleKeyDown)
    })

    return {
      currentStting,
      allHotKeys,
      current_hot_key,
      hotKeyConfig,
      hotKeyStatus,
      handleHotKeyFocus,
      handleHotKeyBlur,
      handleEnableHotKey,
      formatHotKeyName,
      handleHotKeySaveConfig,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.hotKeyContainer {
  display: flex;
  flex-flow: row wrap;
  // margin-top: -15px;
  margin-bottom: 15px;
  transition: opacity @transition-theme;
}
.hotKeyItem {
  width: 30%;
  padding-right: 35px;
  margin-top: 15px;
  box-sizing: border-box;
}
.hotKeyItemTitle {
  .mixin-ellipsis-1;
  padding-bottom: 5px;
  color: @color-theme_2-font-label;
  font-size: 12px;
}
.hotKeyItemInput {
  width: 100%;
  box-sizing: border-box;
  // font-family: monospace;
  &:focus {
    background-color: @color-theme_2-active;
    text-decoration: none;
  }
  &::placeholder {
    color: rgba(197, 197, 197, 0.7)!important;
  }
}
.hotKeyFailed {
  text-decoration: line-through;
}

.del-line {
  position: relative;
  &:before {
    display: block;
    height: 1px;
    position: absolute;
    width: 110%;
    content: ' ';
    left: 0;
    background-color: #000;
    transform: rotate(-24deg);
    transform-origin: 0;
    top: 83%;
    z-index: 1;
  }
  &:after {
    display: block;
    height: 1px;
    position: absolute;
    width: 110%;
    content: ' ';
    left: 0;
    background-color: #000;
    transform: rotate(23deg);
    transform-origin: 0px;
    top: 2px;
    z-index: 1;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .hotKeyItemTitle {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }
  }
})
</style>
