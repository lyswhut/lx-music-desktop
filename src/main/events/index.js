if (!global.lx_event) global.lx_event = {}

const Common = require('./Common')
const MainWindow = require('./MainWindow')
const Tray = require('./Tray')
const WinLyric = require('./WinLyric')
const HotKey = require('./HotKey')

const { Event: TaskBar } = require('../modules/taskbar')
const { Event: UserApi } = require('../modules/userApi')
const { Event: Sync } = require('../modules/sync')

if (!global.lx_event.common) global.lx_event.common = new Common()
if (!global.lx_event.mainWindow) global.lx_event.mainWindow = new MainWindow()
if (!global.lx_event.tray) global.lx_event.tray = new Tray()
if (!global.lx_event.winLyric) global.lx_event.winLyric = new WinLyric()
if (!global.lx_event.hotKey) global.lx_event.hotKey = new HotKey()

if (!global.lx_event.taskbar) global.lx_event.taskbar = new TaskBar()
if (!global.lx_event.userApi) global.lx_event.userApi = new UserApi()
if (!global.lx_event.sync) global.lx_event.sync = new Sync()
