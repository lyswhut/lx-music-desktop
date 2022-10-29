import { setMeta } from '@common/utils/musicMeta'

export const writeMeta = (filePath: string, meta: LX.Music.MusicFileMeta) => {
  setMeta(filePath, meta)
}

export { saveLrc } from './utils'
