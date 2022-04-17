const { mainOn, NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('../../common/ipc')
const getStore = require('@common/store')

const LRC_RAW = 'lyrics'
const LRC_EDITED = 'lyrics_edited'

mainHandle(ipcMainWindowNames.get_lyric, async(event, id) => {
  return getStore(LRC_EDITED, true, false).get(id) || getStore(LRC_RAW, true, false).get(id) || {}
})


// 原始歌词
mainHandle(ipcMainWindowNames.get_lyric_raw, async(event, id) => getStore(LRC_RAW, true, false).get(id) || {})
mainOn(ipcMainWindowNames.save_lyric_raw, (event, { id, lyrics }) => getStore(LRC_RAW, true, false).set(id, lyrics))
mainOn(ipcMainWindowNames.clear_lyric_raw, () => getStore(LRC_RAW, true, false).clear())

// 已编辑的歌词
mainHandle(ipcMainWindowNames.get_lyric_edited, async(event, id) => getStore(LRC_EDITED, true, false).get(id) || {})
mainOn(ipcMainWindowNames.save_lyric_edited, (event, { id, lyrics }) => getStore(LRC_EDITED, true, false).set(id, lyrics))
mainOn(ipcMainWindowNames.remove_lyric_edited, async(event, id) => getStore(LRC_EDITED, true, false).delete(id))
