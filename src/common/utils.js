const log = require('electron-log')

exports.isLinux = process.platform == 'linux'
exports.isWin = process.platform == 'win32'
exports.isMac = process.platform == 'darwin'


exports.log = log
