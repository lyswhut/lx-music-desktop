<template lang="pug">
dt#sync
  | {{ $t('setting__sync') }}
  button(class="help-btn" :aria-label="$t('setting__sync_tip')" @click="openUrl('https://lyswhut.github.io/lx-music-doc/desktop/faq/sync')")
    svg-icon(name="help-circle-outline")
dd
  base-checkbox(id="setting_sync_enable" :model-value="appSetting['sync.enable']" :label="$t('setting__sync_enable')" @update:model-value="updateSetting({ 'sync.enable': $event })")

dd
  h3#sync_mode {{ $t('setting__sync_mode') }}
  div
    base-checkbox.gap-left(id="setting_sync_mode_server" :disabled="sync.enable" :model-value="appSetting['sync.mode']" need value="server" :label="$t('setting__sync_mode_server')" @update:model-value="updateSetting({ 'sync.mode': $event })")
    base-checkbox.gap-left(id="setting_sync_mode_client" :disabled="sync.enable" :model-value="appSetting['sync.mode']" need value="client" :label="$t('setting__sync_mode_client')" @update:model-value="updateSetting({ 'sync.mode': $event })")


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
