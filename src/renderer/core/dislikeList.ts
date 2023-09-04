// import { toRaw } from '@common/utils/vueTools'
import { action } from '@renderer/store/dislikeList'
import {
  getDislikeListInfo,
  addDislikeInfo as addDislikeInfoRemote,
  overwirteDislikeInfo as overwirteDislikeInfoRemote,
  // updateDislikeInfo as updateDislikeInfoRemote,
  // removeDislikeInfo as removeDislikeInfoRemote,
  // clearDislikeInfo as clearDislikeInfoRemote,
} from '@renderer/utils/ipc'


export const initDislikeInfo = async() => {
  action.initDislikeInfo(await getDislikeListInfo())
}

export const addDislikeInfo = async(infos: LX.Dislike.DislikeMusicInfo[]) => {
  await addDislikeInfoRemote(infos)
  return action.addDislikeInfo(infos)
}

export const overwirteDislikeInfo = async(rules: string) => {
  await overwirteDislikeInfoRemote(rules)
  return action.overwirteDislikeInfo(rules)
}

// export const updateDislikeInfo = async(info: LX.Dislike.ListItem) => {
//   await updateDislikeInfoRemote([toRaw(info)])
//   action.updateDislikeInfo(info)
// }

// export const removeDislikeInfo = async(ids: string[]) => {
//   await removeDislikeInfoRemote(toRaw(ids))
//   action.removeDislikeInfo(ids)
// }


// export const clearDislikeInfo = async() => {
//   await clearDislikeInfoRemote()
//   action.clearDislikeInfo()
// }


export const hasDislike = (info: LX.Music.MusicInfo | null) => {
  if (!info) return false
  return action.hasDislike(info)
}

