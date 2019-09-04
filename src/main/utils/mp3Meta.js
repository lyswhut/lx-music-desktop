const NodeID3 = require('node-id3')
const path = require('path')
const fs = require('fs')
const request = require('request')
const extReg = /^(\.(?:jpe?g|png)).*$/

module.exports = (filePath, meta) => {
  if (!meta.APIC) return NodeID3.write(meta, filePath)
  let picPath = path.join(path.dirname(filePath), `${meta.title}-${meta.artist}${path.extname(meta.APIC).replace(extReg, '$1')}`)
  request(meta.APIC).pipe(fs.createWriteStream(picPath)).on('finish', () => {
    meta.APIC = picPath
    NodeID3.write(meta, filePath)
    fs.unlink(picPath, err => {
      if (err) console.log(err.message)
    })
  })
}
