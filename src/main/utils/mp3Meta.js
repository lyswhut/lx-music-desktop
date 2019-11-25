const NodeID3 = require('node-id3')
const path = require('path')
const fs = require('fs')
const request = require('request')
const extReg = /^(\.(?:jpe?g|png)).*$/

module.exports = (filePath, meta) => {
  if (!meta.APIC) return NodeID3.write(meta, filePath)
  if (!/^http/.test(meta.APIC)) {
    delete meta.APIC
    return NodeID3.write(meta, filePath)
  }
  let picPath = filePath.replace(/\.mp3$/, '') + path.extname(meta.APIC).replace(extReg, '$1')
  request(meta.APIC)
    .on('response', respones => {
      if (respones.statusCode !== 200 && respones.statusCode != 206) {
        delete meta.APIC
        NodeID3.write(meta, filePath)
        return
      }
      respones
        .pipe(fs.createWriteStream(picPath))
        .on('finish', () => {
          if (respones.complete) {
            meta.APIC = picPath
            NodeID3.write(meta, filePath)
          } else {
            delete meta.APIC
          }
          fs.unlink(picPath, err => {
            if (err) console.log(err.message)
          })
        }).on('error', err => {
          if (err) console.log(err.message)
          delete meta.APIC
          NodeID3.write(meta, filePath)
        })
    })
    .on('error', err => {
      if (err) console.log(err.message)
      delete meta.APIC
      NodeID3.write(meta, filePath)
    })
}
