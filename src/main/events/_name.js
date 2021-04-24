exports.common = {
  initConfig: 'initConfig',
  configStatus: 'config',
}

exports.mainWindow = {
  name: 'mainWindow',
  setLyricInfo: 'setLyricInfo',
  destroy: 'destroy',
  quit: 'quit',
  toggle_minimize: 'toggle_minimize',
  toggle_hide: 'toggle_hide',
  ready_to_show: 'ready_to_show',
  show: 'show',
  hide: 'hide',
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
