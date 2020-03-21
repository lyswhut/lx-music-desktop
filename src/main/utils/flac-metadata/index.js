// https://github.com/claus/flac-metadata

module.exports.Processor = require('./lib/Processor')

module.exports.data = {
  MetaDataBlock: require('./lib/data/MetaDataBlock'),
  MetaDataBlockStreamInfo: require('./lib/data/MetaDataBlockStreamInfo'),
  MetaDataBlockVorbisComment: require('./lib/data/MetaDataBlockVorbisComment'),
  MetaDataBlockPicture: require('./lib/data/MetaDataBlockPicture'),
}
