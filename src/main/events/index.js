global.lx_event = {}

const Tray = require('./tray')

if (!global.lx_event.setting) global.lx_event.tray = new Tray()
