import { rendererSend, rendererInvoke, NAMES } from '../../common/ipc'
import { throttle } from './index'

let listPosition = {}
let listPrevSelectId
let listUpdateInfo = {}

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
export const getListPositionAll = () => listPosition
export const setListPositionAll = positions => {
  listPosition = positions
  saveListPosition()
}
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

export const initListUpdateInfo = () => {
  return rendererInvoke(NAMES.mainWindow.get_data, 'listUpdateInfo').then(data => {
    if (!data) data = {}
    // console.log(data)
    listUpdateInfo = data
  })
}
const saveListUpdateInfo = throttle(() => {
  rendererSend(NAMES.mainWindow.save_data, {
    path: 'listUpdateInfo',
    data: listUpdateInfo,
  })
}, 1000)

export const getListUpdateInfo = () => listUpdateInfo
export const setListUpdateInfo = info => {
  listUpdateInfo = info
  saveListUpdateInfo()
}
export const setListAutoUpdate = (id, enable) => {
  const targetInfo = listUpdateInfo[id] ?? { updateTime: '', isAutoUpdate: false }
  targetInfo.isAutoUpdate = enable
  listUpdateInfo[id] = targetInfo
  saveListUpdateInfo()
}
export const setListUpdateTime = (id, time) => {
  const targetInfo = listUpdateInfo[id] ?? { updateTime: '', isAutoUpdate: false }
  targetInfo.updateTime = time
  listUpdateInfo[id] = targetInfo
  saveListUpdateInfo()
}
// export const setListUpdateInfo = (id, { updateTime, isAutoUpdate }) => {
//   listUpdateInfo[id] = { updateTime, isAutoUpdate }
//   saveListUpdateInfo()
// }
export const removeListUpdateInfo = id => {
  delete listUpdateInfo[id]
  saveListUpdateInfo()
}
