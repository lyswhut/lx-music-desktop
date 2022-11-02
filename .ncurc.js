module.exports = {
  upgrade: true,
  reject: [
    'electron',
    'chalk',
    'del',
    'svgo-loader',
  ],
  // target: 'newest',
  // filter: [
  //   /^vue/,
  //   'electron-builder',
  //   'electron-updater',
  // ],

  // target: 'minor',
  // filter: [
  //   'electron',
  // ],
}
