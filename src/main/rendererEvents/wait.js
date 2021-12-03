const { mainOn, mainHandle, NAMES: { mainWindow: ipcMainWindowNames } } = require('@common/ipc')

const timeoutMap = new Map()

mainHandle(ipcMainWindowNames.wait, (event, { time, id }) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (timeoutMap.has(id)) timeoutMap.delete(id)
      resolve()
    }, time)
    timeoutMap.set(id, {
      timeout,
      resolve,
      reject,
    })
  })
})

mainOn(ipcMainWindowNames.wait_cancel, (event, id) => {
  if (!timeoutMap.has(id)) return
  const timeout = timeoutMap.get(id)
  timeoutMap.delete(id)
  clearTimeout(timeout.timeout)
  timeout.reject('cancelled')
})
