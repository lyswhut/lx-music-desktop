import { useCommit, useRefGetter, onBeforeUnmount, toRaw } from '@renderer/utils/vueTools'
import { sync as eventSyncName } from '@renderer/event/names'
import { syncEnable, onSyncStatus } from '@renderer/utils/tools'
import { sync } from '@renderer/core/share'
import { allList, defaultList, loveList, userLists } from '@renderer/core/share/list'

export default () => {
  const setList = useCommit('list', 'setList')
  const listAdd = useCommit('list', 'listAdd')
  const listMove = useCommit('list', 'listMove')
  const listAddMultiple = useCommit('list', 'listAddMultiple')
  const listMoveMultiple = useCommit('list', 'listMoveMultiple')
  const listRemove = useCommit('list', 'listRemove')
  const listRemoveMultiple = useCommit('list', 'listRemoveMultiple')
  const listClear = useCommit('list', 'listClear')
  const updateMusicInfo = useCommit('list', 'updateMusicInfo')
  const createUserList = useCommit('list', 'createUserList')
  const removeUserList = useCommit('list', 'removeUserList')
  const setUserListName = useCommit('list', 'setUserListName')
  const setMusicPosition = useCommit('list', 'setMusicPosition')
  const setSyncListData = useCommit('list', 'setSyncListData')
  const setUserListPosition = useCommit('list', 'setUserListPosition')

  const setting = useRefGetter('setting')

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
      case 'set_user_list_position':
        setUserListPosition(data)
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
            defaultList: { ...toRaw(defaultList), list: toRaw(allList[defaultList.id]) },
            loveList: { ...toRaw(loveList), list: toRaw(allList[loveList.id]) },
            userList: userLists.map(l => ({ ...toRaw(l), list: toRaw(allList[l.id]) })),
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

  if (setting.value.sync.enable && setting.value.sync.port) {
    syncEnable({
      enable: setting.value.sync.enable,
      port: setting.value.sync.port,
    })
  }


  onBeforeUnmount(() => {
    rSyncStatus()
  })
}
