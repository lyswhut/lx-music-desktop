import { showSelectDialog } from '@renderer/utils/ipc'
import { addLocalMusics } from './state'

const handleAddMusics = async(filePaths: string[], index: number = 0) => {
  const paths = filePaths.slice(index, index + 200)
  const musicInfos = await window.lx.worker.main.createLocalMusicInfos(paths)
  if (musicInfos.length) addLocalMusics(musicInfos)
  index += 200
  if (filePaths.length > index) await handleAddMusics(filePaths, index)
}

export const addLocalFile = async() => {
  const { canceled, filePaths } = await showSelectDialog({
    title: window.i18n.t('lists__add_local_dir_desc'),
    properties: ['openDirectory'],
  })
  if (canceled || !filePaths.length) return

  const musicFiles = await window.lx.worker.main.scanLocalMusicDir(filePaths[0])
  if (!musicFiles.length) return

  await handleAddMusics(musicFiles)
}
