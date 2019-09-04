const fs = require('fs')
const flac = require('flac-metadata')

module.exports = (filenPath, meta) => {
  const reader = fs.createReadStream(filenPath)
  const tempPath = filenPath + '.lxmtemp'
  const writer = fs.createWriteStream(tempPath)
  const processor = new flac.Processor()
  if (meta.APIC) delete meta.APIC

  const comments = []
  for (const key in meta) {
    comments.push(`${key.toUpperCase()}=${meta[key]}`)
  }
  const vendor = 'lx-music-desktop'

  processor.on('preprocess', function(mdb) {
    // Remove existing VORBIS_COMMENT block, if any.
    if (mdb.type === flac.Processor.MDB_TYPE_VORBIS_COMMENT) {
      mdb.remove()
    }
    // Inject new VORBIS_COMMENT block.
    if (mdb.removed || mdb.isLast) {
      let mdbVorbis = flac.data.MetaDataBlockVorbisComment.create(mdb.isLast, vendor, comments)
      this.push(mdbVorbis.publish())
    }
  })

  reader.pipe(processor).pipe(writer).on('finish', () => {
    fs.unlink(filenPath, err => {
      if (err) return console.log(err.message)
      fs.rename(tempPath, filenPath, err => {
        if (err) console.log(err.message)
      })
    })
  })
}

