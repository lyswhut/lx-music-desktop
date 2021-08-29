const { mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('@common/ipc')
const { getFonts } = require('@main/utils/fontManage')

mainHandle(ipcMainWindowNames.get_system_fonts, getFonts)

