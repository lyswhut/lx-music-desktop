const { mainOn } = require('../../common/icp')
const { setMeta } = require('../utils/musicMeta')

mainOn('setMusicMeta', (event, { filePath, meta }) => {
  setMeta(filePath, meta)
})
