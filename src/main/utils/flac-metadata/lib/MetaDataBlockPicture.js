const MetaDataBlock = require('./MetaDataBlock')

class MetaDataBlockPicture extends MetaDataBlock {
  constructor(isLast) {
    super(isLast, 6)

    this.pictureType = 0
    this.mimeType = ''
    this.description = ''
    this.width = 0
    this.height = 0
    this.bitsPerPixel = 0
    this.colors = 0
    this.pictureData = null
  }

  static create(isLast, pictureType, mimeType, description, width, height, bitsPerPixel, colors, pictureData) {
    let mdb = new MetaDataBlockPicture(isLast)
    mdb.pictureType = pictureType
    mdb.mimeType = mimeType
    mdb.description = description
    mdb.width = width
    mdb.height = height
    mdb.bitsPerPixel = bitsPerPixel
    mdb.colors = colors
    mdb.pictureData = pictureData
    mdb.hasData = true
    return mdb
  }


  parse(buffer) {
    try {
      let pos = 0

      this.pictureType = buffer.readUInt32BE(pos)
      pos += 4

      let mimeTypeLength = buffer.readUInt32BE(pos)
      this.mimeType = buffer.toString('utf8', pos + 4, pos + 4 + mimeTypeLength)
      pos += 4 + mimeTypeLength

      let descriptionLength = buffer.readUInt32BE(pos)
      this.description = buffer.toString('utf8', pos + 4, pos + 4 + descriptionLength)
      pos += 4 + descriptionLength

      this.width = buffer.readUInt32BE(pos)
      this.height = buffer.readUInt32BE(pos + 4)
      this.bitsPerPixel = buffer.readUInt32BE(pos + 8)
      this.colors = buffer.readUInt32BE(pos + 12)
      pos += 16

      let pictureDataLength = buffer.readUInt32BE(pos)
      this.pictureData = Buffer.alloc(pictureDataLength)
      buffer.copy(this.pictureData, 0, pos + 4, pictureDataLength)

      this.hasData = true
    } catch (e) {
      this.error = e
      this.hasData = false
    }
  }

  publish() {
    let pos = 0
    let size = this.getSize()
    let buffer = Buffer.alloc(4 + size)

    let header = size
    header |= (this.type << 24)
    header |= (this.isLast ? 0x80000000 : 0)
    buffer.writeUInt32BE(header >>> 0, pos)
    pos += 4

    buffer.writeUInt32BE(this.pictureType, pos)
    pos += 4

    let mimeTypeLen = Buffer.byteLength(this.mimeType)
    buffer.writeUInt32BE(mimeTypeLen, pos)
    buffer.write(this.mimeType, pos + 4)
    pos += 4 + mimeTypeLen

    let descriptionLen = Buffer.byteLength(this.description)
    buffer.writeUInt32BE(descriptionLen, pos)
    buffer.write(this.description, pos + 4)
    pos += 4 + descriptionLen

    buffer.writeUInt32BE(this.width, pos)
    buffer.writeUInt32BE(this.height, pos + 4)
    buffer.writeUInt32BE(this.bitsPerPixel, pos + 8)
    buffer.writeUInt32BE(this.colors, pos + 12)
    pos += 16

    buffer.writeUInt32BE(this.pictureData.length, pos)
    this.pictureData.copy(buffer, pos + 4)

    return buffer
  }

  getSize() {
    let size = 4
    size += 4 + Buffer.byteLength(this.mimeType)
    size += 4 + Buffer.byteLength(this.description)
    size += 16
    size += 4 + this.pictureData.length
    return size
  }

  toString() {
    let str = '[MetaDataBlockPicture]'
    str += ' type: ' + this.type
    str += ', isLast: ' + this.isLast
    if (this.error) {
      str += '\n  ERROR: ' + this.error
    }
    if (this.hasData) {
      str += '\n  pictureType: ' + this.pictureType
      str += '\n  mimeType: ' + this.mimeType
      str += '\n  description: ' + this.description
      str += '\n  width: ' + this.width
      str += '\n  height: ' + this.height
      str += '\n  bitsPerPixel: ' + this.bitsPerPixel
      str += '\n  colors: ' + this.colors
      str += '\n  pictureData: ' + (this.pictureData ? this.pictureData.length : '<null>')
    }
    return str
  }
}

module.exports = MetaDataBlockPicture
