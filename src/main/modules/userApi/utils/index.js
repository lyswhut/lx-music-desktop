const { userApis: defaultUserApis } = require('../config')
const getStore = require('@common/store')

let userApis

exports.getUserApis = () => {
  const electronStore_userApi = getStore('userApi')
  if (userApis) return userApis
  userApis = electronStore_userApi.get('userApis')
  if (!userApis) {
    userApis = defaultUserApis
    electronStore_userApi.set('userApis', userApis)
  }
  for (const api of userApis) {
    if (api.allowShowUpdateAlert == null) api.allowShowUpdateAlert = false
  }
  return userApis
}

exports.importApi = script => {
  let scriptInfo = script.split(/\r?\n/)
  let name = scriptInfo[1] || ''
  let description = scriptInfo[2] || ''
  name = name.startsWith(' * @name ') ? name.replace(' * @name ', '').trim() : `user_api_${new Date().toLocaleString()}`
  if (name.length > 24) name = name.substring(0, 24) + '...'
  description = description.startsWith(' * @description ') ? description.replace(' * @description ', '').trim() : ''
  if (description.length > 36) description = description.substring(0, 36) + '...'
  const apiInfo = {
    id: `user_api_${Math.random().toString().substring(2, 5)}_${Date.now()}`,
    name,
    description,
    script,
    allowShowUpdateAlert: true,
  }
  userApis.push(apiInfo)
  getStore('userApi').set('userApis', userApis)
  return apiInfo
}

exports.removeApi = ids => {
  for (let index = userApis.length - 1; index > -1; index--) {
    if (ids.includes(userApis[index].id)) {
      userApis.splice(index, 1)
      ids.splice(index, 1)
    }
  }
  getStore('userApi').set('userApis', userApis)
}

exports.setAllowShowUpdateAlert = (id, enable) => {
  const targetApi = userApis.find(api => api.id == id)
  if (!targetApi) return
  targetApi.allowShowUpdateAlert = enable
  getStore('userApi').set('userApis', userApis)
}
