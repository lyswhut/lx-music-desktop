import { addListMusics, setFetchingListStatus } from '@renderer/store/list/action'
import { showSelectDialog } from '@renderer/utils/ipc'


const handleAddMusics = async(listId: string, filePaths: string[], index: number = -1) => {
  // console.log(index + 1, index + 201)
  const paths = filePaths.slice(index + 1, index + 201)
  const musicInfos = await window.lx.worker.main.createLocalMusicInfos(paths)
  if (musicInfos.length) await addListMusics(listId, musicInfos)
  index += 200
  if (filePaths.length - 1 > index) await handleAddMusics(listId, filePaths, index)
}
export const addLocalFile = async(listInfo: LX.List.MyListInfo) => {
  const { canceled, filePaths } = await showSelectDialog({
    title: window.i18n.t('lists__add_local_file_desc'),
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Media File', extensions: ['mp3', 'flac', 'ogg', 'wav'] },
      // { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (canceled || !filePaths.length) return

  console.log(filePaths)
  setFetchingListStatus(listInfo.id, true)
  await handleAddMusics(listInfo.id, filePaths)
  setFetchingListStatus(listInfo.id, false)
}
