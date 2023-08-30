
import { throttle } from '@common/utils/common'
import { toRaw } from '@common/utils/vueTools'
import {
  getSearchHistoryList,
  saveSearchHistoryList,
} from '@renderer/utils/ipc'
import { appSetting } from '../setting'
import { searchText, historyList } from './state'


export const setSearchText = (text: string) => {
  searchText.value = text
}

let isInitedSearchHistory = false
const saveSearchHistoryListThrottle = throttle((list: LX.List.SearchHistoryList) => {
  saveSearchHistoryList(list)
}, 500)


export const getHistoryList = async() => {
  if (isInitedSearchHistory || historyList.length) return
  historyList.push(...(await getSearchHistoryList() ?? []))
  isInitedSearchHistory ||= true
}
export const addHistoryWord = async(word: string) => {
  if (!appSetting['search.isShowHistorySearch']) return
  if (!isInitedSearchHistory) await getHistoryList()
  let index = historyList.indexOf(word)
  if (index == 0) return
  if (index > -1) historyList.splice(index, 1)
  if (historyList.length >= 15) historyList.splice(14, historyList.length - 14)
  historyList.unshift(word)
  saveSearchHistoryListThrottle(toRaw(historyList))
}
export const removeHistoryWord = (index: number) => {
  historyList.splice(index, 1)
  saveSearchHistoryListThrottle(toRaw(historyList))
}
export const clearHistoryList = (id: string) => {
  historyList.splice(0, historyList.length)
  saveSearchHistoryList([])
}
