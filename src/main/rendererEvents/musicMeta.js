const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { setMeta } = require('../utils/musicMeta')

mainOn(ipcMainWindowNames.set_music_meta, (event, { filePath, meta }) => {
  setMeta(filePath, meta)
})
