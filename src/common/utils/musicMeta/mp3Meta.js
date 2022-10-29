const NodeID3 = require('node-id3')
const path = require('path')
const fs = require('fs')
const download = require('./downloader')
const extReg = /^(\.(?:jpe?g|png)).*$/

const handleWriteMeta = (meta, filePath) => {
  if (meta.lyrics) {
    meta.unsynchronisedLyrics = {
      language: 'zho',
      text: meta.lyrics,
    }
    delete meta.lyrics
  }
  NodeID3.write(meta, filePath)
}

module.exports = (filePath, meta) => {
  if (!meta.APIC) return handleWriteMeta(meta, filePath)
  if (!/^http/.test(meta.APIC)) {
    delete meta.APIC
    return handleWriteMeta(meta, filePath)
  }
  let ext = path.extname(meta.APIC)
  let picPath = filePath.replace(/\.mp3$/, '') + (ext ? ext.replace(extReg, '$1') : '.jpg')
  download(meta.APIC, picPath).then(success => {
    if (success) {
      meta.APIC = picPath
      handleWriteMeta(meta, filePath)
      fs.unlink(picPath, err => {
        if (err) console.log(err.message)
      })
    } else {
      delete meta.APIC
      handleWriteMeta(meta, filePath)
    }
  })
}
