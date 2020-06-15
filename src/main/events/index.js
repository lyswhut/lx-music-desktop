global.lx_event = {}

const Tray = require('./tray')

if (!global.lx_event.tray) global.lx_event.tray = new Tray()
