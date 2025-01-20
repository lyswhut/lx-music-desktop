module.exports = {
  upgrade: true,
  reject: [
    'electron',
    'chalk',
    'del',
    'comlink',
    'vue',
    'image-size',
    'message2call',
    '@types/ws',
    'eslint',
    '@types/node',
    'electron-debug',
    // 'eslint-config-standard-with-typescript',
  ],

  // target: 'newest',
  // filter: [
  //   'electron-builder',
  //   'electron-updater',
  // ],

  // target: 'patch',
  // filter: [
  //   'vue',
  // ],

  // target: 'minor',
  // filter: [
  //   'electron',
  //   'eslint',
  //   'electron-debug',
  //   '@types/node',
  // ],
}
