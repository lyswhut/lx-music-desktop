import fs from 'fs'
import path from 'path'
import { gzip } from 'zlib'
import { promisify } from 'util'
import { LIST_IDS } from '@common/constants'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainHandle } from '@common/mainIpc'

const gzipAsync = promisify(gzip)

// 自动备份文件的文件名前缀，轮转清理时只处理匹配此前缀的文件
const BACKUP_FILE_PREFIX = 'lx_backup_auto_'
// 备份文件名时间部分格式：lx_backup_auto_2026-10-28_18-00-00.lxmc
const pad = (n: number) => String(n).padStart(2, '0')

const getBackupDirPath = (): string => global.lx.appSetting['backup.autoBackup.path']

const getMaxBackupCount = (): number => Math.max(1, global.lx.appSetting['backup.autoBackup.maxBackupCount'] || 1)

/**
 * 从数据库服务收集全部列表数据（与手动导出「列表」备份的 playList_v2 格式一致）
 */
const getBackupLists = async() => {
  const dbService = global.lx.worker.dbService
  const lists = []
  lists.push({
    id: LIST_IDS.DEFAULT,
    name: 'list__name_default',
    list: await dbService.getListMusics(LIST_IDS.DEFAULT),
  })
  lists.push({
    id: LIST_IDS.LOVE,
    name: 'list__name_love',
    list: await dbService.getListMusics(LIST_IDS.LOVE),
  })
  for (const list of await dbService.getAllUserList()) {
    lists.push({
      ...list,
      list: await dbService.getListMusics(list.id),
    })
  }
  return lists
}

const cleanOldBackups = async(dirPath: string) => {
  const files = (await fs.promises.readdir(dirPath))
    .filter(name => name.startsWith(BACKUP_FILE_PREFIX) && name.endsWith('.lxmc'))
    .sort()
  const maxCount = getMaxBackupCount()
  const removeCount = files.length - maxCount
  for (let i = 0; i < removeCount; i++) {
    await fs.promises.unlink(path.join(dirPath, files[i])).catch(err => {
      console.error('auto backup remove old file failed', err)
    })
  }
}

/**
 * 执行一次自动备份（写出带时间戳的备份文件并按保留数量轮转清理）
 */
export const runAutoBackup = async() => {
  const dirPath = getBackupDirPath()
  if (!dirPath) throw new Error('auto backup path is empty')
  await fs.promises.mkdir(dirPath, { recursive: true })
  const data = {
    type: 'playList_v2',
    data: await getBackupLists(),
  }
  const time = new Date()
  const fileName = `${BACKUP_FILE_PREFIX}${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}_${pad(time.getHours())}-${pad(time.getMinutes())}-${pad(time.getSeconds())}.lxmc`
  const content = await gzipAsync(JSON.stringify(data))
  await fs.promises.writeFile(path.join(dirPath, fileName), content)
  await cleanOldBackups(dirPath)
  console.log('auto backup saved:', fileName)
}

let backupTimer: NodeJS.Timeout | null = null

export const initAutoBackup = () => {
  // 立即备份（设置页手动触发）
  mainHandle(WIN_MAIN_RENDERER_EVENT_NAME.run_auto_backup, async() => {
    await runAutoBackup()
  })

  // 列表变化后延时自动备份，合并短时间内的多次改动
  global.lx.event_list.on('list_changed', () => {
    if (!global.lx.appSetting['backup.autoBackup.enable']) return
    if (backupTimer) clearTimeout(backupTimer)
    backupTimer = setTimeout(() => {
      backupTimer = null
      void runAutoBackup().catch(err => {
        console.error('auto backup failed', err)
      })
    }, 5000)
  })
}
