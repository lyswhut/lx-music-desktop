const Store = require('electron-store')
const { mainOn, NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('../../common/ipc')


const electronStore_data = new Store({
  name: 'data',
})

mainHandle(ipcMainWindowNames.get_data, async(event, path) => electronStore_data.get(path))


mainOn(ipcMainWindowNames.save_data, (event, { path, data }) => electronStore_data.set(path, data))
