const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { tranditionalize } = require('../utils/simplify-chinese-main')


mainHandle(ipcMainWindowNames.lang_s2t, async(event, textBase64) => {
  if (!global.modules.mainWindow) throw new Error('mainWindow is undefined')
  const text = tranditionalize(Buffer.from(textBase64, 'base64').toString())
  return Buffer.from(text).toString('base64')
})
