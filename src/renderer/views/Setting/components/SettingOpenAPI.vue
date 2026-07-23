<template lang="pug">
dt#sync {{ $t('setting__open_api') }}
dd
  div.setting-card.setting-card-full
    .setting-card-header {{ $t('setting__open_api') }}
    .setting-card-body
      .gap-top
        base-checkbox(id="setting_open_api_enable" :model-value="appSetting['openAPI.enable']" :label="$t('setting__open_api_enable')" @update:model-value="updateSetting({ 'openAPI.enable': $event })")
      .gap-top
        base-checkbox(id="setting_open_api_bind_lan" :model-value="appSetting['openAPI.bindLan']" :label="$t('setting__open_api_bind_lan')" @update:model-value="updateSetting({ 'openAPI.bindLan': $event })")
      .gap-top.small
        | {{ $t('setting__open_api_address') }}
        span.select {{ openAPI.address }}
      .gap-top.small(v-if="openAPI.message") {{ openAPI.message }}
      .p.gap-top
        .p.small {{ $t('setting__open_api_port') }}
        div
          base-input.gap-left(:class="$style.portInput" :model-value="appSetting['openAPI.port']" type="number" :placeholder="$t('setting__open_api_port_tip')" @update:model-value="setPort")
      .p.gap-top
        | {{ $t('setting__open_api_tip') }}
        strong.hover.underline(aria-label="https://lyswhut.github.io/lx-music-doc/desktop/faq/open-api" @click="openUrl('https://lyswhut.github.io/lx-music-doc/desktop/open-api')") {{ $t('setting__open_api_tip_link') }}
</template>

<script>
// import { computed } from '@common/utils/vueTools'
import { openAPI } from '@renderer/store'
import { openUrl } from '@common/utils/electron'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { debounce } from '@common/utils'

export default {
  name: 'SettingOpenAPI',
  setup() {
    const setPort = debounce(port => {
      updateSetting({ 'openAPI.port': port.trim() })
    }, 500)

    return {
      appSetting,
      updateSetting,
      openAPI,
      openUrl,
      setPort,
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

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.portInput[disabled], .hostInput[disabled] {
  opacity: .8 !important;
}
</style>
