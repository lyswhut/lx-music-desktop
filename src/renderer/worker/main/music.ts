import { getLocalMusicFileLyric, getLocalMusicFilePic } from '@renderer/utils/music'


export const getMusicFilePic = async(filePath: string) => {
  const picture = await getLocalMusicFilePic(filePath)
  if (!picture) return ''
  return `data:${picture.format};base64,${picture.data.toString('base64')}`
}

export const getMusicFileLyric = async(filePath: string): Promise<LX.Music.LyricInfo | null> => {
  const lyric = await getLocalMusicFileLyric(filePath)
  if (!lyric) return null
  return {
    lyric,
  }
}
