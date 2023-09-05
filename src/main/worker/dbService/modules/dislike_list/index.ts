import { SPLIT_CHAR } from '@common/constants'
import {
  queryDislikeList,
  inertDislikeList,
  overwirteDislikeList,
  // updateDislikeList,
  // deleteDislikeList,
  // clearDislikeList,
} from './dbHelper'

// let dislikeInfo: LX.Dislike.DislikeInfo

const toDBDislikeInfo = (musicInfos: string[]): LX.DBService.DislikeInfo[] => {
  const list: LX.DBService.DislikeInfo[] = []
  for (const item of musicInfos) {
    if (!item.trim()) continue
    list.push({
      content: item,
    })
  }
  return list
}

const initDislikeList = () => {
  const dislikeInfo: LX.Dislike.DislikeInfo = {
    // musicIds: new Set<string>(),
    names: new Set<string>(),
    singerNames: new Set<string>(),
    musicNames: new Set<string>(),
    rules: '',
  }
  const list: string[] = []
  for (const item of queryDislikeList()) {
    if (!item) continue
    let [name, singer] = item.content.split(SPLIT_CHAR.DISLIKE_NAME)
    if (name) {
      name = name.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
      if (singer) {
        singer = singer.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
        const rule = `${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`
        dislikeInfo.names.add(rule)
        list.push(rule)
      } else {
        dislikeInfo.musicNames.add(name)
        list.push(name)
      }
    } else if (singer) {
      singer = singer.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
      dislikeInfo.singerNames.add(singer)
      list.push(`${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
    }
  }

  dislikeInfo.rules = Array.from(new Set(list)).join('\n')

  return dislikeInfo
}

/**
 * 获取不喜欢列表信息
 * @returns 不喜欢列表信息
 */
export const getDislikeListInfo = (): LX.Dislike.DislikeInfo => {
  // if (!dislikeInfo) initDislikeList()
  return initDislikeList()
}


/**
 * 添加信息
 * @param lists 列表信息
 */
export const dislikeInfoAdd = async(lists: LX.Dislike.DislikeMusicInfo[]) => {
  await inertDislikeList(lists.map(info => ({ content: `${info.name}${SPLIT_CHAR.DISLIKE_NAME}${info.singer}` })))
}

/**
 * 覆盖列表信息
 * @param rules 规则信息
 */
export const dislikeInfoOverwrite = async(rules: string) => {
  await overwirteDislikeList(toDBDislikeInfo(rules.split('\n')))
}


// /**
//  * 删除不喜欢列表
//  * @param ids 歌曲id
//  */
// export const dislikeInfoRemove = (ids: string[]) => {
//   deleteDislikeList(ids)
// }

// /**
//  * 清空不喜欢列表
//  */
// export const dislikeInfoClear = () => {
//   clearDislikeList()
// }

