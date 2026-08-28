import { addListMusics, setFetchingListStatus } from '@renderer/store/list/action'
import { showSelectDialog } from '@renderer/utils/ipc'
import fs from 'node:fs/promises'
import path from 'node:path'


const handleAddMusics = async(listId: string, filePaths: string[], index: number = -1) => {
  // console.log(index + 1, index + 201)
  const paths = filePaths.slice(index + 1, index + 201)
  const musicInfos = await window.lx.worker.main.createLocalMusicInfos(paths)
  if (musicInfos.length) await addListMusics(listId, musicInfos)
  index += 200
  if (filePaths.length - 1 > index) await handleAddMusics(listId, filePaths, index)
}

// 支持的音频文件扩展名
const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.ogg', '.oga', '.wav', '.m4a',
])

// 递归获取文件夹中的所有音频文件
const getAudioFilesFromFolder = async(folderPath: string): Promise<string[]> => {
  const audioFiles: string[] = []

  const scanFolder = async(currentPath: string) => {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)

        if (entry.isDirectory()) {
          // 递归扫描子文件夹
          await scanFolder(fullPath)
        } else if (entry.isFile()) {
          // 检查是否为支持的音频文件
          const ext = path.extname(entry.name).toLowerCase()
          if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) {
            audioFiles.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.error(`Failed to scan folder: ${currentPath}`, error)
    }
  }

  await scanFolder(folderPath)
  return audioFiles
}
export const addLocalFile = async(listInfo: LX.List.MyListInfo) => {
  const { canceled, filePaths } = await showSelectDialog({
    title: window.i18n.t('lists__add_local_file_desc'),
    properties: ['openFile', 'multiSelections'],
    filters: [
      // https://support.google.com/chromebook/answer/183093
      // 3gp, .avi, .mov, .m4v, .m4a, .mp3, .mkv, .ogm, .ogg, .oga, .webm, .wav
      { name: 'Media File', extensions: ['mp3', 'flac', 'ogg', 'oga', 'wav', 'm4a'] },
      // { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (canceled || !filePaths.length) return

  console.log(filePaths)
  setFetchingListStatus(listInfo.id, true)
  await handleAddMusics(listInfo.id, filePaths)
  setFetchingListStatus(listInfo.id, false)
}

export const addLocalFolder = async(listInfo: LX.List.MyListInfo) => {
  const { canceled, filePaths } = await showSelectDialog({
    title: window.i18n.t('lists__add_local_folder_desc'),
    properties: ['openDirectory'],
  })
  if (canceled || !filePaths.length) return

  const folderPath = filePaths[0]
  console.log('Scanning folder:', folderPath)

  setFetchingListStatus(listInfo.id, true)
  try {
    // 递归获取文件夹中的所有音频文件
    const audioFiles = await getAudioFilesFromFolder(folderPath)
    console.log(`Found ${audioFiles.length} audio files`)

    if (audioFiles.length > 0) {
      await handleAddMusics(listInfo.id, audioFiles)
    }
  } catch (error) {
    console.error('Failed to add local folder:', error)
  }
  setFetchingListStatus(listInfo.id, false)
}
