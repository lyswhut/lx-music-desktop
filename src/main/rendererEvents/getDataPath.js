const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')
const { app } = require('electron')

mainHandle(ipcMainWindowNames.get_data_path, async() => app.getPath('userData'))

