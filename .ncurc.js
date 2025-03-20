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
    'eslint-webpack-plugin',

    'eslint-plugin-vue',
    'vue-eslint-parser',
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
  //   'eslint-webpack-plugin',
  //   'electron-debug',
  //   '@types/node',

  //   'eslint-plugin-vue',
  //   'vue-eslint-parser',
  // ],
}
