import { UserDataManage } from './data'
import {
  ListManage,
  DislikeManage,
} from '../modules'

export interface UserSpace {
  dataManage: UserDataManage
  listManage: ListManage
  dislikeManage: DislikeManage
  getDecices: () => Promise<LX.Sync.ServerKeyInfo[]>
  removeDevice: (clientId: string) => Promise<void>
}
const users = new Map<string, UserSpace>()

const delayTime = 10 * 1000
const delayReleaseTimeouts = new Map<string, NodeJS.Timeout>()
const clearDelayReleaseTimeout = (userName: string) => {
  if (!delayReleaseTimeouts.has(userName)) return

  clearTimeout(delayReleaseTimeouts.get(userName))
  delayReleaseTimeouts.delete(userName)
}
const seartDelayReleaseTimeout = (userName: string) => {
  clearDelayReleaseTimeout(userName)
  delayReleaseTimeouts.set(userName, setTimeout(() => {
    users.delete(userName)
  }, delayTime))
}

export const getUserSpace = (userName = 'default') => {
  clearDelayReleaseTimeout(userName)

  let user = users.get(userName)
  if (!user) {
    console.log('new user data manage:', userName)
    const dataManage = new UserDataManage(userName)
    const listManage = new ListManage(dataManage)
    const dislikeManage = new DislikeManage(dataManage)
    users.set(userName, user = {
      dataManage,
      listManage,
      dislikeManage,
      async getDecices() {
        return this.dataManage.getAllClientKeyInfo()
      },
      async removeDevice(clientId) {
        await listManage.removeDevice(clientId)
        await dataManage.removeClientKeyInfo(clientId)
      },
    })
  }
  return user
}

export const releaseUserSpace = (userName = 'default', force = false) => {
  if (force) {
    clearDelayReleaseTimeout(userName)
    users.delete(userName)
  } else seartDelayReleaseTimeout(userName)
}


export * from './data'
