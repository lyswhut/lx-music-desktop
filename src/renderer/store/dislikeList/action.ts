import { markRaw } from '@common/utils/vueTools'


import { dislikeInfo, dislikeRuleCount } from './state'
import { SPLIT_CHAR } from '@common/constants'


export const hasDislike = (info: LX.Music.MusicInfo | LX.Download.ListItem) => {
  if ('progress' in info) info = info.metadata.musicInfo
  const name = info.name?.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim() ?? ''
  const singer = info.singer?.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim() ?? ''

  return dislikeInfo.musicNames.has(name) || dislikeInfo.singerNames.has(singer) ||
    dislikeInfo.names.has(`${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
}

export const initDislikeInfo = ({ musicNames, rules, names, singerNames }: LX.Dislike.DislikeInfo) => {
  dislikeInfo.names = markRaw(names)
  dislikeInfo.singerNames = markRaw(singerNames)
  dislikeInfo.musicNames = markRaw(musicNames)
  dislikeInfo.rules = rules
  dislikeRuleCount.value = dislikeInfo.musicNames.size + dislikeInfo.singerNames.size + dislikeInfo.names.size
}

const initNameSet = () => {
  dislikeInfo.names.clear()
  dislikeInfo.musicNames.clear()
  dislikeInfo.singerNames.clear()
  const list: string[] = []
  for (const item of dislikeInfo.rules.split('\n')) {
    if (!item) continue
    let [name, singer] = item.split(SPLIT_CHAR.DISLIKE_NAME)
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
  dislikeRuleCount.value = dislikeInfo.musicNames.size + dislikeInfo.singerNames.size + dislikeInfo.names.size
}

export const addDislikeInfo = (infos: LX.Dislike.DislikeMusicInfo[]) => {
  dislikeInfo.rules += '\n' + infos.map(info => `${info.name ?? ''}${SPLIT_CHAR.DISLIKE_NAME}${info.singer ?? ''}`).join('\n')
  initNameSet()
  return dislikeInfo.rules
}

export const overwirteDislikeInfo = (rules: string) => {
  dislikeInfo.rules = rules
  initNameSet()
  return dislikeInfo.rules
}

export const clearDislikeInfo = () => {
  dislikeInfo.rules = ''
  initNameSet()
  return dislikeInfo.rules
}


// export const updateDislikeInfo = (info: LX.Dislike.ListItem) => {
//   const targetInfo = dislikeInfo.list.find(i => i.id == info.id)
//   if (!targetInfo) return
//   targetInfo.name = info.name
//   targetInfo.singer = info.singer
//   initNameSet()
// }

// export const removeDislikeInfo = (ids: string[]) => {
//   for (const id of ids) {
//     dislikeInfo.list.splice(dislikeInfo.list.findIndex(info => info.id == id), 1)
//   }
//   initNameSet()
// }

// export const clearDislikeInfo = () => {
//   dislikeInfo.rules = ''
//   initNameSet()
// }

