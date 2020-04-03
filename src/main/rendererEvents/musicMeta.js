const { mainOn } = require('../../common/ipc')
const { setMeta } = require('../utils/musicMeta')

mainOn('setMusicMeta', (event, { filePath, meta }) => {
  setMeta(filePath, meta)
})
