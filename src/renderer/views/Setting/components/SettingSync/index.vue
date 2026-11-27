<template lang="pug">
dt#sync
  | {{ $t('setting__sync') }}
  button(class="help-btn" :aria-label="$t('setting__sync_tip')" @click="openUrl('https://lyswhut.github.io/lx-music-doc/desktop/faq/sync')")
    svg-icon(name="help-circle-outline")
dd
  div(:class="$style.cardRow")
    div(:class="$style.sectionCard")
      h3#sync_mode(:class="$style.sectionCardTitle") {{ $t('setting__sync_mode') }}
      div(:class="$style.sectionCardBody")
        base-checkbox(id="setting_sync_enable" :model-value="appSetting['sync.enable']" :label="$t('setting__sync_enable')" @update:model-value="updateSetting({ 'sync.enable': $event })")
      div(:class="$style.sectionCardBody")
        div
          base-checkbox(id="setting_sync_mode_server" :disabled="sync.enable" :model-value="appSetting['sync.mode']" need value="server" :label="$t('setting__sync_mode_server')" @update:model-value="updateSetting({ 'sync.mode': $event })")
        .gap-top
          div
            base-checkbox(id="setting_sync_mode_client" :disabled="sync.enable" :model-value="appSetting['sync.mode']" need value="client" :label="$t('setting__sync_mode_client')" @update:model-value="updateSetting({ 'sync.mode': $event })")
    div(:class="$style.sectionCard")
      SyncClient(v-if="sync.mode == 'client'")
      SyncServer(v-else)

</template>

<script>
// import { computed } from '@common/utils/vueTools'
import { sync } from '@renderer/store'
import { openUrl } from '@common/utils/electron'
import { appSetting, updateSetting } from '@renderer/store/setting'
import SyncServer from './SyncServer.vue'
import SyncClient from './SyncClient.vue'

export default {
  name: 'SettingSync',
  components: {
    SyncServer,
    SyncClient,
  },
  setup() {
    return {
      appSetting,
      updateSetting,
      sync,
      openUrl,
    }
  },
}
</script>

<style lang="less" module>
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
</style>
