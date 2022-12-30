import { markRaw, onBeforeUnmount } from '@common/utils/vueTools'
import { onSyncAction, sendSyncAction } from '@renderer/utils/ipc'
import { sync } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'

export default () => {
  const handleSyncList = (event: LX.Sync.SyncMainWindowActions) => {
    switch (event.action) {
      case 'select_mode':
        sync.deviceName = event.data.deviceName
        sync.isShowSyncMode = true
        break
      case 'close_select_mode':
        sync.isShowSyncMode = false
        break
      case 'status':
        sync.status.status = event.data.status
        sync.status.message = event.data.message
        sync.status.address = markRaw(event.data.address)
        sync.status.code = event.data.code
        sync.status.devices = markRaw(event.data.devices)
        break
    }
  }

  const rSyncAction = onSyncAction(({ params }) => {
    handleSyncList(params)
  })

  onBeforeUnmount(() => {
    rSyncAction()
  })

  return async() => {
    sync.enable = appSetting['sync.enable']
    sync.port = appSetting['sync.port']
    if (appSetting['sync.enable'] && appSetting['sync.port']) {
      void sendSyncAction({
        action: 'enable',
        data: {
          enable: appSetting['sync.enable'],
          port: appSetting['sync.port'],
        },
      })
    }
  }
}
