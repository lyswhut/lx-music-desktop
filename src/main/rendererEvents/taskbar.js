const { mainSend, mainOn, NAMES: { mainWindow: ipcMainWindowNames }, mainHandle } = require('@common/ipc')
const { setThumbnailClip, setThumbarButtons, eventNames } = require('../modules/taskbar')
const { mainWindow: MAIN_WINDOW_EVENT_NAME } = require('@main/events/_name')

const handleThumbarButtonClick = action => {
  mainSend(global.modules.mainWindow, ipcMainWindowNames.taskbar_on_thumbar_button_click, action)
}

global.lx_event.taskbar.on(eventNames.thumbarButtonClick, handleThumbarButtonClick)
global.lx_event.mainWindow.on(MAIN_WINDOW_EVENT_NAME.show, setThumbarButtons)

mainHandle(ipcMainWindowNames.taskbar_set_thumbnail_clip, (event, clip) => {
  return setThumbnailClip(clip)
})

mainOn(ipcMainWindowNames.taskbar_set_thumbar_buttons, (event, buttons) => {
  setThumbarButtons(buttons)
})
