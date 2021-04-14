const { mainOn, NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('../../common/ipc')
const getStore = require('@common/store')


mainHandle(ipcMainWindowNames.get_music_url, async(event, id) => getStore('musicUrls', true, false).get(id) || '')


mainOn(ipcMainWindowNames.save_music_url, (event, { id, url }) => getStore('musicUrls', true, false).set(id, url))

mainOn(ipcMainWindowNames.clear_music_url, () => getStore('musicUrls', true, false).clear())
