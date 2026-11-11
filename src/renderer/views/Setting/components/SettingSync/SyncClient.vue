<template lang="pug">
h3(:class="$style.sectionCardTitle") {{ $t('setting__sync_client_mode') }}
div(:class="$style.sectionCardBody")
  .p.small {{ $t('setting__sync_client_status', { status: clientStatus }) }}
  .p.small {{ $t('setting__sync_client_address', { address: sync.client.status.address.join(', ') || '' }) }}
  .p
    .p.small {{ $t('setting__sync_client_host') }}
    div
      base-input.gap-left(:class="$style.hostInput" :model-value="appSetting['sync.client.host']" :disabled="sync.enable" :placeholder="$t('setting__sync_client_host_tip')" @update:model-value="setSyncClientHost")
</template>

<script>
import { computed } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { useI18n } from '@renderer/plugins/i18n'
import { appSetting, updateSetting } from '@renderer/store/setting'
import { debounce } from '@common/utils/common'
import { SYNC_CODE } from '@common/constants_sync'

export default {
  name: 'SettingSyncClient',
  setup() {
    const t = useI18n()

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

    const setSyncClientHost = debounce(host => {
      updateSetting({ 'sync.client.host': host.trim() })
    }, 500)


    return {
      appSetting,
      sync,
      setSyncClientHost,
      clientStatus,
    }
  },
}
</script>

<style lang="less" module>
// 设置分区卡片：标题色带 + 内容区，与其他设置页一致（外层卡片容器在 index.vue）
.sectionCardTitle {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  background-color: var(--color-primary-light-200-alpha-600);
}

.sectionCardBody {
  padding: 12px 16px;
}

.hostInput[disabled] {
  opacity: .8 !important;
}

.hostInput {
  min-width: 0;
  width: 100%;
}
</style>
