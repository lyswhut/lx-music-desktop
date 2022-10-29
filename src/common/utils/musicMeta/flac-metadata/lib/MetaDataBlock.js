class MetaDataBlock {
  constructor(isLast, type) {
    this.isLast = isLast
    this.type = type
    this.error = null
    this.hasData = false
    this.removed = false
  }

  remove() {
    this.removed = true
  }

  parse(buffer) {
  }

  toString() {
    let str = '[MetaDataBlock]'
    str += ' type: ' + this.type
    str += ', isLast: ' + this.isLast
    return str
  }
}

module.exports = MetaDataBlock
