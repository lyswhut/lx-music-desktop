const path = require('path')
const mp3Meta = require('./mp3Meta')
const flacMeta = require('./flacMeta')

exports.setMeta = (filePath, meta) => {
  switch (path.extname(filePath)) {
    case '.mp3':
      mp3Meta(filePath, meta)
      break
    case '.flac':
      flacMeta(filePath, meta)
      break
  }
}
