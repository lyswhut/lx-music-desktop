import path from 'node:path'
import { toRaw } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { getListMusics } from '@renderer/store/list/action'
import { defaultList, loveList, userLists } from '@renderer/store/list/state'

export default () => {
  if (!appSetting['backup.auto.enable']) return

  const getAllLists = async() => {
    const lists: any[] = []
    lists.push(await getListMusics(defaultList.id).then(musics => ({ ...defaultList, list: toRaw(musics) })))
    lists.push(await getListMusics(loveList.id).then(musics => ({ ...loveList, list: toRaw(musics) })))
    for await (const list of userLists) {
      lists.push(await getListMusics(list.id).then(musics => ({ ...toRaw(list), list: toRaw(musics) })))
    }
    return lists
  }

  const pad = (num: number) => num < 10 ? '0' + num : String(num)
  const now = new Date()
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const fileName = `lx_autobackup_${timestamp}.lxmc`
  const saveDir = appSetting['backup.auto.savePath']
  const savePath = path.join(saveDir, fileName)

  void getAllLists().then(lists => {
    const allData = {
      type: 'allData_v2',
      setting: { ...appSetting },
      playList: lists,
    }
    void window.lx.worker.main.saveLxConfigFile(savePath, allData)

    // 清理旧备份
    const maxNum = appSetting['backup.auto.maxNum']
    void window.lx.worker.main.readDir(saveDir).then((files: string[]) => {
      const backupFiles = files
        .filter((f: string) => f.startsWith('lx_autobackup_') && f.endsWith('.lxmc'))
        .sort()
      while (backupFiles.length > maxNum) {
        const oldestFile = backupFiles.shift()
        if (oldestFile) {
          void window.lx.worker.main.removeFile(path.join(saveDir, oldestFile))
        }
      }
    }).catch(() => {
      // 目录可能不存在，忽略错误
    })
  })
}