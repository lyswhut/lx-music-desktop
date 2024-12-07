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
    'webpack-dev-server',
    // 'eslint-config-standard-with-typescript',
    'typescript', // https://devblogs.microsoft.com/typescript/announcing-typescript-5-7/#typedarrays-are-now-generic-over-arraybufferlike
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
