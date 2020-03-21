const fs = require('fs')
const { Processor: FlacProcessor, data: { MetaDataBlockVorbisComment: FlacComment } } = require('./flac-metadata')
const vendor = 'reference libFLAC 1.2.1 20070917'

module.exports = (filenPath, meta) => {
  const reader = fs.createReadStream(filenPath)
  const tempPath = filenPath + '.lxmtemp'
  const writer = fs.createWriteStream(tempPath)
  const flacProcessor = new FlacProcessor()
  if (meta.APIC) delete meta.APIC

  const comments = []
  for (const key in meta) {
    comments.push(`${key.toUpperCase()}=${meta[key]}`)
  }

  let isInjected = false
  flacProcessor.on('preprocess', function(mdb) {
    // Remove existing VORBIS_COMMENT block, if any.
    if (mdb.type === flacProcessor.MDB_TYPE_VORBIS_COMMENT) mdb.remove()
    // Inject new VORBIS_COMMENT block.
    if ((mdb.removed || mdb.isLast) && !isInjected) {
      isInjected = true
      let mdbVorbis = FlacComment.create(mdb.isLast, vendor, comments)
      this.push(mdbVorbis.publish())
    }
  })

  reader.pipe(flacProcessor).pipe(writer).on('finish', () => {
    fs.unlink(filenPath, err => {
      if (err) return console.log(err.message)
      fs.rename(tempPath, filenPath, err => {
        if (err) console.log(err.message)
      })
    })
  })
}

