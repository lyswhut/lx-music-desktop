const del = require('del')
// const copyFile = require('./copyFile')

module.exports = () => {
  del.sync(['publish/assets/*'])
  // return copyFile(false)
}

