const { mainOn, NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('../../common/ipc')
const getStore = require('@common/store')


mainHandle(ipcMainWindowNames.get_lyric, async(event, id) => getStore('lyrics').get(id) || {})


mainOn(ipcMainWindowNames.save_lyric, (event, { id, lyrics }) => getStore('lyrics').set(id, lyrics))

mainOn(ipcMainWindowNames.clear_lyric, () => getStore('lyrics').clear())
