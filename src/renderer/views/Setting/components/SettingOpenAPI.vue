<template lang="pug">
dt#open_api {{ $t('setting__open_api') }}
dd.gap-top
  div(:class="$style.cardRow")
    div(:class="$style.sectionCard")
      h3#open_api_options(:class="$style.sectionCardTitle") {{ $t('setting__open_api_options') }}
      div(:class="$style.sectionCardBody")
        .p
          base-checkbox(id="setting_open_api_enable" :model-value="appSetting['openAPI.enable']" :label="$t('setting__open_api_enable')" @update:model-value="updateSetting({ 'openAPI.enable': $event })")
        .p.gap-top
          base-checkbox(id="setting_open_api_bind_lan" :model-value="appSetting['openAPI.bindLan']" :label="$t('setting__open_api_bind_lan')" @update:model-value="updateSetting({ 'openAPI.bindLan': $event })")
        .p.gap-top.small
          | {{ $t('setting__open_api_address') }}
          span.select {{ openAPI.address }}
        .p.small(v-if="openAPI.message") {{ openAPI.message }}
        .p
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

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

// 设置分区卡片：头部色带 + 浅色主题底，与其他设置页一致
.sectionCard {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-primary-light-300-alpha-700);
}

.cardRow {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
  align-items: stretch;
}

.sectionCardTitle {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  background-color: var(--color-primary-light-200-alpha-600);
}

.sectionCardBody {
  padding: 12px 16px;
}

.portInput[disabled], .hostInput[disabled] {
  opacity: .8 !important;
}
</style>
