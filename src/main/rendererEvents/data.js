const { mainOn, NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('../../common/ipc')
const getStore = require('@common/store')


mainHandle(ipcMainWindowNames.get_data, async(event, path) => getStore('data').get(path))


mainOn(ipcMainWindowNames.save_data, (event, { path, data }) => getStore('data').set(path, data))
