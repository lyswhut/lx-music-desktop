<template lang="pug">
dt#sync
  | {{ $t('setting__sync') }}
  button(class="help-btn" :aria-label="$t('setting__sync_tip')" @click="openUrl('https://lyswhut.github.io/lx-music-doc/desktop/faq/sync')")
    svg-icon(name="help-circle-outline")
dd.cards-row.sync-cards-row
  div.setting-card
    .setting-card-header {{ $t('setting__sync') }}
    .setting-card-body
      .gap-top
        base-checkbox(id="setting_sync_enable" :model-value="appSetting['sync.enable']" :label="$t('setting__sync_enable')" @update:model-value="updateSetting({ 'sync.enable': $event })")
      .gap-top
        base-checkbox.gap-left(id="setting_sync_mode_server" :disabled="sync.enable" :model-value="appSetting['sync.mode']" need value="server" :label="$t('setting__sync_mode_server')" @update:model-value="updateSetting({ 'sync.mode': $event })")
      .gap-top
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

<style lang="less">
dd.cards-row.sync-cards-row {
  display: flex !important;
  flex-flow: row nowrap !important;
  flex-wrap: nowrap !important;
  overflow-x: auto !important;
  gap: 15px !important;
  padding: 0;
  margin: 0 0 10px;
  width: 100%;

  > .setting-card {
    margin: 0;
    flex: 0 0 auto !important;
    width: fit-content !important;
    max-width: none !important;
    min-width: 0 !important;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background-color: rgba(77, 175, 124, 0.12);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    border: 1px solid rgba(77, 175, 124, 0.25);
    overflow: hidden;

    .setting-card-header {
      padding: 8px 16px;
      font-weight: bold;
      font-size: 13px;
      color: var(--color-primary);
      border-bottom: 1px solid rgba(77, 175, 124, 0.25);
      width: 100%;
      box-sizing: border-box;
      white-space: nowrap;
    }

    .setting-card-body {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      box-sizing: border-box;

      .gap-top {
        margin-left: 0 !important;
        margin-top: 10px;
        width: fit-content !important;
        display: block;
        text-align: left;
        white-space: nowrap;

        &:first-child {
          margin-top: 0;
        }

        label {
          justify-content: flex-start;
          white-space: nowrap;
        }
      }

      .gap-left {
        margin-left: 0 !important;
        margin-top: 10px;
        width: fit-content !important;
        display: block;
        text-align: left;
        white-space: nowrap;

        &:first-child {
          margin-top: 0;
        }

        label {
          justify-content: flex-start;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
