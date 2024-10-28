import { getLocalMusicFileLyric, getLocalMusicFilePic } from '@renderer/utils/music'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { checkPath } from '@common/utils/nodejs'

const getTempDir = async() => {
  const tempDir = path.join(os.tmpdir(), 'lxmusic_temp')
  if (!await checkPath(tempDir)) {
    await fs.mkdir(tempDir, { recursive: true })
  }
  return tempDir
}

export const getMusicFilePic = async(filePath: string) => {
  const picture = await getLocalMusicFilePic(filePath)
  if (!picture) return ''
  if (typeof picture == 'string') return picture
  if (picture.data.length > 400_000) {
    try {
      const tempDir = await getTempDir()
      const tempFile = path.join(tempDir, path.basename(filePath) + '.' + picture.format.split('/')[1])
      await fs.writeFile(tempFile, picture.data)
      return tempFile
    } catch (err) {
      console.log(err)
    }
  }
  return `data:${picture.format};base64,${Buffer.from(picture.data).toString('base64')}`
}

export const getMusicFileLyric = async(filePath: string): Promise<LX.Music.LyricInfo | null> => {
  const lyric = await getLocalMusicFileLyric(filePath)
  if (!lyric) return null
  return lyric
}
