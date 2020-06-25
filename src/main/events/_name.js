exports.common = {
  initConfig: 'initConfig',
  config: 'config',
}

exports.mainWindow = {
  name: 'mainWindow',
  setLyricInfo: 'setLyricInfo',
  destroy: 'destroy',
  quit: 'quit',
  toggle_minimize: 'toggle_minimize',
  toggle_hide: 'toggle_hide',
}

exports.tray = {
  name: 'tray',
  create: 'create',
  destroy: 'destroy',
}

exports.winLyric = {
  name: 'winLyric',
  create: 'create',
  close: 'close',
}

exports.hotKey = {
  name: 'hotKey',
  init: 'init',
  config: 'config',
  keyDown: 'keyDown',
}
