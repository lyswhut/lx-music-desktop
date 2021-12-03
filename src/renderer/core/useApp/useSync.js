import { useCommit, useGetter, onBeforeUnmount } from '@renderer/utils/vueTools'
import { sync as eventSyncName } from '@renderer/event/names'
import { syncEnable, onSyncStatus } from '@renderer/utils/tools'
import { sync } from '@renderer/core/share'

export default () => {
  const setList = useCommit('setList')
  const listAdd = useCommit('listAdd')
  const listMove = useCommit('listMove')
  const listAddMultiple = useCommit('listAddMultiple')
  const listMoveMultiple = useCommit('listMoveMultiple')
  const listRemove = useCommit('listRemove')
  const listRemoveMultiple = useCommit('listRemoveMultiple')
  const listClear = useCommit('listClear')
  const updateMusicInfo = useCommit('updateMusicInfo')
  const createUserList = useCommit('createUserList')
  const removeUserList = useCommit('removeUserList')
  const setUserListName = useCommit('setUserListName')
  const moveupUserList = useCommit('moveupUserList')
  const movedownUserList = useCommit('movedownUserList')
  const setMusicPosition = useCommit('setMusicPosition')
  const setSyncListData = useCommit('setSyncListData')

  const setting = useGetter('setting')

  const handleSyncAction = ({ action, data }) => {
    if (typeof data == 'object') data.isSync = true
    // console.log(action, data)

    switch (action) {
      case 'set_list':
        setList(data)
        break
      case 'list_add':
        listAdd(data)
        break
      case 'list_move':
        listMove(data)
        break
      case 'list_add_multiple':
        listAddMultiple(data)
        break
      case 'list_move_multiple':
        listMoveMultiple(data)
        break
      case 'list_remove':
        listRemove(data)
        break
      case 'list_remove_multiple':
        listRemoveMultiple(data)
        break
      case 'list_clear':
        listClear(data)
        break
      case 'update_music_info':
        updateMusicInfo(data)
        break
      case 'create_user_list':
        createUserList(data)
        break
      case 'remove_user_list':
        removeUserList(data)
        break
      case 'set_user_list_name':
        setUserListName(data)
        break
      case 'moveup_user_list':
        moveupUserList(data)
        break
      case 'movedown_user_list':
        movedownUserList(data)
        break
      case 'set_music_position':
        setMusicPosition(data)
        break
      default:
        break
    }
  }

  const handleSyncList = ({ action, data }) => {
    switch (action) {
      case 'getData':
        global.eventHub.emit(eventSyncName.send_sync_list, {
          action: 'getData',
          data: {
            defaultList: this.defaultList,
            loveList: this.loveList,
            userList: this.userList,
          },
        })
        break
      case 'setData':
        setSyncListData(data)
        break
      case 'selectMode':
        sync.deviceName = data.deviceName
        sync.isShowSyncMode = true
        break
      case 'closeSelectMode':
        sync.isShowSyncMode = false
        break
    }
  }

  window.eventHub.on(eventSyncName.handle_action_list, handleSyncAction)
  window.eventHub.on(eventSyncName.handle_sync_list, handleSyncList)

  const rSyncStatus = onSyncStatus((event, status) => {
    sync.status.status = status.status
    sync.status.message = status.message
    sync.status.address = status.address
    sync.status.code = status.code
    sync.status.devices = status.devices
  })

  if (setting.sync.enable && setting.sync.port) {
    syncEnable({
      enable: setting.sync.enable,
      port: setting.sync.port,
    })
  }


  onBeforeUnmount(() => {
    rSyncStatus()
  })
}
