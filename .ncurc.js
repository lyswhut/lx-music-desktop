module.exports = {
  upgrade: true,
  reject: [
    'electron',
    'chalk',
    'del',
    'comlink',
    'vue',
    '@types/ws',
    // 'eslint-config-standard-with-typescript',
  ],

  // target: 'newest',
  // filter: [
  //   'electron-builder',
  //   'electron-updater',
  //   'electron-log',
  // ],

  // target: 'patch',
  // filter: [
  //   'vue',
  // ],

  // target: 'minor',
  // filter: [
  //   'eslint-plugin-n',
  //   'electron',
  //   'eslint-config-standard-with-typescript',
  //   '@typescript-eslint/eslint-plugin',
  //   '@typescript-eslint/parser',
  // ],
}
