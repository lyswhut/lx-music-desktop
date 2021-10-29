import { rendererSend, rendererInvoke, NAMES } from '../../common/ipc'
import { throttle } from './index'

let listPosition = {}
let listPrevSelectId

const saveListPosition = throttle(() => {
  rendererSend(NAMES.mainWindow.save_data, {
    path: 'listPosition',
    data: listPosition,
  })
}, 1000)

export const initListPosition = () => {
  return rendererInvoke(NAMES.mainWindow.get_data, 'listPosition').then(data => {
    if (!data) data = {}
    listPosition = data
  })
}
export const getListPosition = id => listPosition[id] || 0
export const setListPosition = (id, position) => {
  listPosition[id] = position || 0
  saveListPosition()
}
export const removeListPosition = id => {
  delete listPosition[id]
  saveListPosition()
}

const saveListPrevSelectId = throttle(() => {
  rendererSend(NAMES.mainWindow.save_data, {
    path: 'listPrevSelectId',
    data: listPrevSelectId,
  })
}, 200)
export const initListPrevSelectId = () => {
  return rendererInvoke(NAMES.mainWindow.get_data, 'listPrevSelectId').then(id => {
    listPrevSelectId = id
  })
}
export const getListPrevSelectId = () => listPrevSelectId
export const setListPrevSelectId = id => {
  listPrevSelectId = id
  saveListPrevSelectId()
}
