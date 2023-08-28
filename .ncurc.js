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
    'typescript', // https://github.com/microsoft/TypeScript/pull/54567
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
  //   'electron',
  // ],
}
