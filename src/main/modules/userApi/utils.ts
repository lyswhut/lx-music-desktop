import { userApis as defaultUserApis } from './config'
import { STORE_NAMES } from '@common/constants'
import getStore from '@main/utils/store'

let userApis: LX.UserApi.UserApiInfo[] | null

export const getUserApis = (): LX.UserApi.UserApiInfo[] => {
  const electronStore_userApi = getStore(STORE_NAMES.USER_API)
  if (userApis) return userApis
  userApis = electronStore_userApi.get('userApis') as LX.UserApi.UserApiInfo[]
  if (!userApis) {
    userApis = defaultUserApis
    electronStore_userApi.set('userApis', userApis)
  }
  for (const api of userApis) {
    if (api.allowShowUpdateAlert == null) api.allowShowUpdateAlert = false
  }
  return userApis
}

export const importApi = (script: string): LX.UserApi.UserApiInfo => {
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
  userApis ??= []
  userApis.push(apiInfo)
  getStore(STORE_NAMES.USER_API).set('userApis', userApis)
  return apiInfo
}

export const removeApi = (ids: string[]) => {
  if (!userApis) return
  for (let index = userApis.length - 1; index > -1; index--) {
    if (ids.includes(userApis[index].id)) {
      userApis.splice(index, 1)
      ids.splice(index, 1)
    }
  }
  getStore(STORE_NAMES.USER_API).set('userApis', userApis)
}

export const setAllowShowUpdateAlert = (id: string, enable: boolean) => {
  const targetApi = userApis?.find(api => api.id == id)
  if (!targetApi) return
  targetApi.allowShowUpdateAlert = enable
  getStore(STORE_NAMES.USER_API).set('userApis', userApis)
}
