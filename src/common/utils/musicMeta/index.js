const path = require('path')
const mp3Meta = require('./mp3Meta')
const flacMeta = require('./flacMeta')
const m4aMeta = require('./m4aMeta')

exports.setMeta = (filePath, meta, proxy) => {
  switch (path.extname(filePath)) {
    case '.mp3':
      mp3Meta(filePath, meta, proxy)
      break
    case '.flac':
      flacMeta(filePath, meta, proxy)
      break
    case '.m4a':
    case '.m4b':
    case '.mp4':
      m4aMeta(filePath, meta, proxy)
      break
  }
}
