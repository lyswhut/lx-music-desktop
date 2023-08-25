import { UserDataManage } from './data'
import {
  ListManage,
} from '../modules'

export interface UserSpace {
  dataManage: UserDataManage
  listManage: ListManage
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
    users.set(userName, user = {
      dataManage,
      listManage: new ListManage(dataManage),
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
