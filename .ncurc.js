module.exports = {
  upgrade: true,
  reject: [
    'electron',
    'chalk',
    'del',
    'comlink',
    'vue',
    'vue-router',
    'image-size',
    'message2call',
    '@types/ws',
    'eslint',
    '@types/node',
    'electron-debug',
    'eslint-webpack-plugin',
    'typescript',
    'undici',

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
  //   'electron',
  //   'vue',
  //   'vue-router',
  // ],

  // target: 'minor',
  // filter: [
  //   'electron',
  //   'eslint',
  //   'eslint-webpack-plugin',
  //   'electron-debug',
  //   'typescript',
  //   '@types/node',
  //   'undici',

  //   'eslint-plugin-vue',
  //   'vue-eslint-parser',
  // ],
}
