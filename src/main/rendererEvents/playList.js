const Store = require('electron-store')
const { mainOn, NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('../../common/ipc')


let electronStore_list
let electronStore_downloadList

mainHandle(ipcMainWindowNames.get_playlist, async(event, isIgnoredError = false) => {
  if (!electronStore_list) {
    electronStore_list = new Store({
      name: 'playList',
      clearInvalidConfig: !isIgnoredError,
    })
  }
  if (!electronStore_downloadList) {
    electronStore_downloadList = new Store({
      name: 'downloadList',
    })
  }

  return {
    defaultList: electronStore_list.get('defaultList'),
    loveList: electronStore_list.get('loveList'),
    userList: electronStore_list.get('userList'),
    downloadList: electronStore_downloadList.get('list'),
  }
})

mainOn(ipcMainWindowNames.save_playlist, (event, { type, data }) => {
  switch (type) {
    case 'defaultList':
    case 'loveList':
    case 'userList':
      electronStore_list && electronStore_list.set(type, data)
      break
    case 'downloadList':
      electronStore_downloadList && electronStore_downloadList.set('list', data)
      break
  }
})
