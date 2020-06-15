// Fork from https://github.com/claus/flac-metadata
// 在 flac-metadata 的基础上修复与改进标签与封面写入逻辑


const Transform = require('stream').Transform

const MetaDataBlock = require('./lib/MetaDataBlock')
const MetaDataBlockStreamInfo = require('./lib/MetaDataBlockStreamInfo')
const MetaDataBlockVorbisComment = require('./lib/MetaDataBlockVorbisComment')
const MetaDataBlockPicture = require('./lib/MetaDataBlockPicture')

const STATE_IDLE = 0
const STATE_MARKER = 1
const STATE_MDB_HEADER = 2
const STATE_MDB = 3
const STATE_PASS_THROUGH = 4

class Processor extends Transform {
  constructor(options) {
    super(options)
    // MDB types
    this.MDB_TYPE_STREAMINFO = 0
    this.MDB_TYPE_PADDING = 1
    this.MDB_TYPE_APPLICATION = 2
    this.MDB_TYPE_SEEKTABLE = 3
    this.MDB_TYPE_VORBIS_COMMENT = 4
    this.MDB_TYPE_CUESHEET = 5
    this.MDB_TYPE_PICTURE = 6
    this.MDB_TYPE_INVALID = 127

    this.state = STATE_IDLE

    this.isFlac = false

    this.buf = null
    this.bufPos = 0

    this.mdb = null
    this.mdbLen = 0
    this.mdbLast = false
    this.mdbPush = false
    this.mdbLastWritten = false

    this.parseMetaDataBlocks = false

    this.waitWriteVorbis = null
    this.waitWritePicture = null
    this.tasks = 0

    if (!(this instanceof Processor)) return new Processor(options)
    if (options && !!options.parseMetaDataBlocks) { this.parseMetaDataBlocks = true }
  }

  writeMeta({ vorbis, picture }) {
    if (vorbis != null) {
      this.waitWriteVorbis = vorbis
      this.tasks++
    }
    if (picture != null) {
      this.waitWritePicture = picture
      this.tasks++
    }
  }

  // clearMeta() {
  //   this.mdbLastWritten = true
  // }

  readMeta(callback) {
    this.parseMetaDataBlocks = true
    this.readCallBack = callback
  }

  _transform(chunk, enc, done) {
    let chunkPos = 0
    let chunkLen = chunk.length
    let isChunkProcessed = false
    let _this = this

    function _safePush(minCapacity, persist, validate) {
      let slice
      let chunkAvailable = chunkLen - chunkPos
      let isDone = (chunkAvailable + this.bufPos >= minCapacity)
      validate = (typeof validate === 'function') ? validate : function() { return true }
      if (isDone) {
        // Enough data available
        if (persist) {
          // Persist the entire block so it can be parsed
          if (this.bufPos > 0) {
            // Part of this block's data is in backup buffer, copy rest over
            chunk.copy(this.buf, this.bufPos, chunkPos, chunkPos + minCapacity - this.bufPos)
            slice = this.buf.slice(0, minCapacity)
          } else {
            // Entire block fits in current chunk
            slice = chunk.slice(chunkPos, chunkPos + minCapacity)
          }
        } else {
          slice = chunk.slice(chunkPos, chunkPos + minCapacity - this.bufPos)
        }
        // Push block after validation
        validate(slice, isDone) && _this.push(slice)
        chunkPos += minCapacity - this.bufPos
        this.bufPos = 0
        this.buf = null
      } else {
        // Not enough data available
        if (persist) {
          // Copy/append incomplete block to backup buffer
          this.buf = this.buf || Buffer.alloc(minCapacity)
          chunk.copy(this.buf, this.bufPos, chunkPos, chunkLen)
        } else {
          // Push incomplete block after validation
          slice = chunk.slice(chunkPos, chunkLen)
          validate(slice, isDone) && _this.push(slice)
        }
        this.bufPos += chunkLen - chunkPos
      }
      return isDone
    };
    let safePush = _safePush.bind(this)

    while (!isChunkProcessed) {
      switch (this.state) {
        case STATE_IDLE:
          this.state = STATE_MARKER
          break
        case STATE_MARKER:
          if (safePush(4, true, this._validateMarker.bind(this))) {
            this.state = this.isFlac ? STATE_MDB_HEADER : STATE_PASS_THROUGH
          } else {
            isChunkProcessed = true
          }
          break
        case STATE_MDB_HEADER:
          if (safePush(4, true, this._validateMDBHeader.bind(this))) {
            this.state = STATE_MDB
          } else {
            isChunkProcessed = true
          }
          break
        case STATE_MDB:
          if (safePush(this.mdbLen, this.parseMetaDataBlocks, this._validateMDB.bind(this))) {
            if (this.mdb.isLast) {
              // This MDB has the isLast flag set to true.
              // Ignore all following MDBs.
              this.mdbLastWritten = true
            }
            this.readCallBack && this.readCallBack(this.mdb)
            if (this.mdbLast) {
              this._writeVorbisComment()
              this._writePicture()
              this.state = STATE_PASS_THROUGH
            } else {
              this.state = STATE_MDB_HEADER
            }
          } else {
            isChunkProcessed = true
          }
          break
        case STATE_PASS_THROUGH:
          safePush(chunkLen - chunkPos, false)
          isChunkProcessed = true
          break
      }
    }

    done()
  }

  _validateMarker(slice, isDone) {
    this.isFlac = (slice.toString('utf8', 0) === 'fLaC')
    // TODO: completely bail out if file is not a FLAC?
    return true
  }

  _validateMDBHeader(slice, isDone) {
    // Parse MDB header
    let header = slice.readUInt32BE(0)
    let type = (header >>> 24) & 0x7f
    this.mdbLast = (((header >>> 24) & 0x80) !== 0)
    this.mdbLen = header & 0xffffff
    // Create appropriate MDB object
    // (data is injected later in _validateMDB, if parseMetaDataBlocks option is set to true)
    switch (type) {
      case this.MDB_TYPE_STREAMINFO:
        this.mdb = new MetaDataBlockStreamInfo(this.mdbLast)
        break
      case this.MDB_TYPE_VORBIS_COMMENT:
        if (this.waitWriteVorbis) {
          this._writeVorbisComment(slice, header)
          this.mdbPush = false
          return this.mdbPush
        } else {
          this.mdb = new MetaDataBlockVorbisComment(this.mdbLast)
          this.readCallback && this.readCallback(this.mdb)
        }
        break
      case this.MDB_TYPE_PICTURE:
        if (this.waitWritePicture) {
          this._writePicture(slice, header)
          this.mdbPush = false
          return this.mdbPush
        } else {
          this.mdb = new MetaDataBlockPicture(this.mdbLast)
          this.readCallback && this.readCallback(this.mdb)
        }
        break
      case this.MDB_TYPE_PADDING:
      case this.MDB_TYPE_APPLICATION:
      case this.MDB_TYPE_SEEKTABLE:
      case this.MDB_TYPE_CUESHEET:
      case this.MDB_TYPE_INVALID:
      default:
        this.mdb = new MetaDataBlock(this.mdbLast, type)
        break
    }

    // this.emit('preprocess', this.mdb)

    if (this.mdbLastWritten) {
      // A previous MDB had the isLast flag set to true.
      // Ignore all following MDBs.
      this.mdb.remove()
    } else {
      if (this.mdbLast && this.tasks > 0) {
        header &= 0x7fffffff
        slice.writeUInt32BE(header >>> 0, 0)
      }
      // The consumer may change the MDB's isLast flag in the preprocess handler.
      // Here that flag is updated in the MDB header.
    }
    this.mdbPush = !this.mdb.removed
    return this.mdbPush
  }

  _validateMDB(slice, isDone) {
    // Parse the MDB if parseMetaDataBlocks option is set to true
    if (this.parseMetaDataBlocks && isDone) {
      this.mdb.parse(slice)
    }
    return this.mdbPush
  }

  _flush(done) {
    // All chunks have been processed
    // Clean up
    this.state = STATE_IDLE
    this.mdbLastWritten = false
    this.isFlac = false
    this.bufPos = 0
    this.buf = null
    this.mdb = null
    done()
  }

  _writeVorbisComment() {
    if (this.waitWriteVorbis == null) return
    let isLast = this.mdbLast && this.tasks === 1
    this.tasks--
    this.push(MetaDataBlockVorbisComment.create(isLast, this.waitWriteVorbis.vendor, this.waitWriteVorbis.comments).publish())
    this.waitWriteVorbis = null
  }

  _writePicture() {
    if (this.waitWritePicture == null) return
    let isLast = this.mdbLast && this.tasks === 1
    this.tasks--
    this.push(
      MetaDataBlockPicture.create(
        isLast, this.waitWritePicture.pictureType,
        this.waitWritePicture.mimeType, this.waitWritePicture.description,
        this.waitWritePicture.width, this.waitWritePicture.height,
        this.waitWritePicture.bitsPerPixel, this.waitWritePicture.colors,
        this.waitWritePicture.pictureData,
      ).publish(),
    )
    this.waitWritePicture = null
  }
}

module.exports = Processor
