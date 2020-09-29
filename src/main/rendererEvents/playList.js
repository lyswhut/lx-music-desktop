const Store = require('electron-store')
const { mainOn, NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('../../common/ipc')


let electronStore_list

mainHandle(ipcMainWindowNames.get_playlist, async(event, isIgnoredError = false) => {
  if (!electronStore_list) {
    electronStore_list = new Store({
      name: 'playList',
      clearInvalidConfig: !isIgnoredError,
    })
  }

  return {
    defaultList: electronStore_list.get('defaultList'),
    loveList: electronStore_list.get('loveList'),
    userList: electronStore_list.get('userList'),
    downloadList: electronStore_list.get('downloadList'),
  }
})

mainOn(ipcMainWindowNames.save_playlist, (event, { type, data }) => electronStore_list && electronStore_list.set(type, data))
