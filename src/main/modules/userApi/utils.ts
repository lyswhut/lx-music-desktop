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

const INFO_NAMES = {
  name: 24,
  description: 36,
  author: 56,
  homepage: 1024,
  version: 36,
} as const
type INFO_NAMES_Type = typeof INFO_NAMES
const matchInfo = (scriptInfo: string) => {
  const infoArr = scriptInfo.split(/\r?\n/)
  const rxp = /^\s?\*\s?@(\w+)\s(.+)$/
  const infos: Partial<Record<keyof typeof INFO_NAMES, string>> = {}
  for (const info of infoArr) {
    const result = rxp.exec(info)
    if (!result) continue
    const key = result[1] as keyof typeof INFO_NAMES
    if (INFO_NAMES[key] == null) continue
    infos[key] = result[2].trim()
  }

  for (const [key, len] of Object.entries(INFO_NAMES) as Array<{ [K in keyof INFO_NAMES_Type]: [K, INFO_NAMES_Type[K]] }[keyof INFO_NAMES_Type]>) {
    infos[key] ||= ''
    if (infos[key] == null) infos[key] = ''
    else if (infos[key]!.length > len) infos[key] = infos[key]!.substring(0, len) + '...'
  }

  return infos as Record<keyof typeof INFO_NAMES, string>
}
export const importApi = (script: string): LX.UserApi.UserApiInfo => {
  const result = /^\/\*[\S|\s]+?\*\//.exec(script)
  if (!result) throw new Error('无效的自定义源文件')

  let scriptInfo = matchInfo(result[0])

  scriptInfo.name ||= `user_api_${new Date().toLocaleString()}`
  const apiInfo = {
    id: `user_api_${Math.random().toString().substring(2, 5)}_${Date.now()}`,
    ...scriptInfo,
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
