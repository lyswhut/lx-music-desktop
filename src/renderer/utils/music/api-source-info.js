// Support qualitys: 128k 320k flac wav

module.exports = [
  {
    id: 'wy',
    name: '五音接口',
    disabled: false,
    supportQualitys: {
      tx: ['128k', '320k', 'flac'],
      wy: ['128k', '320k', 'flac'],
      kw: ['128k', '320k', 'flac'],
      mg: ['128k', '320k', 'flac'],
    },
  },
  {
    id: 'test',
    name: '测试接口',
    disabled: false,
    supportQualitys: {
      kw: ['128k'],
      kg: ['128k'],
      tx: ['128k'],
      wy: ['128k'],
      mg: ['128k'],
      xm: ['128k'],
      // bd: ['128k'],
    },
  },
  {
    id: 'temp',
    name: '临时接口',
    disabled: false,
    supportQualitys: {
      kw: ['128k'],
    },
  },
]
