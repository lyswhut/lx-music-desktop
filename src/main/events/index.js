global.lx_event = {}

const Common = require('./Common')
const MainWindow = require('./MainWindow')
const Tray = require('./Tray')
const WinLyric = require('./WinLyric')

if (!global.lx_event.common) global.lx_event.common = new Common()
if (!global.lx_event.mainWindow) global.lx_event.mainWindow = new MainWindow()
if (!global.lx_event.tray) global.lx_event.tray = new Tray()
if (!global.lx_event.winLyric) global.lx_event.winLyric = new WinLyric()
