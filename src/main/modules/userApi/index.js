const Event = require('./event/event')
const eventNames = require('./event/name')
const { closeWindow } = require('./main')
const { getUserApis, importApi, removeApi, setAllowShowUpdateAlert: saveAllowShowUpdateAlert } = require('./utils')
const { request, cancelRequest, getStatus, loadApi, setAllowShowUpdateAlert } = require('./rendererEvent/rendererEvent')

// const { getApiList, importApi, removeApi, setApi, getStatus, request, eventNames }
let userApiId

exports.Event = Event
exports.eventNames = eventNames

exports.getApiList = getUserApis
exports.importApi = script => {
  return {
    apiInfo: importApi(script),
    apiList: getUserApis(),
  }
}
exports.request = request
exports.cancelRequest = cancelRequest
exports.getStatus = getStatus

exports.removeApi = async ids => {
  if (userApiId && ids.includes(userApiId)) {
    userApiId = null
    await closeWindow()
  }
  removeApi(ids)
  return getUserApis()
}

exports.setApi = async id => {
  if (userApiId) {
    userApiId = null
    await closeWindow()
  }
  const apiList = getUserApis()
  if (!apiList.some(a => a.id === id)) return
  userApiId = id
  await loadApi(id)
}

exports.setAllowShowUpdateAlert = (id, enable) => {
  saveAllowShowUpdateAlert(id, enable)
  setAllowShowUpdateAlert(id, enable)
}
