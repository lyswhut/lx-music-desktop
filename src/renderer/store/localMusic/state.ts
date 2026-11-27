import { reactive } from '@common/utils/vueTools'

export const localMusicList = reactive<LX.Music.MusicInfo[]>([])

export const addLocalMusics = (musicInfos: LX.Music.MusicInfo[]) => {
  localMusicList.push(...musicInfos)
}

export const removeLocalMusic = (index: number) => {
  localMusicList.splice(index, 1)
}

export const clearLocalMusics = () => {
  localMusicList.length = 0
}
