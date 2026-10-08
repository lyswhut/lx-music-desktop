import { toRaw } from '@common/utils/vueTools'
import { log } from '@common/utils'
import { getListMusics } from '@renderer/store/list/action'
import { defaultList, loveList, userLists } from '@renderer/store/list/state'
import { appSetting } from '@renderer/store/setting'

const AUTO_BACKUP_PREFIX = 'lx_list_auto_'
const AUTO_BACKUP_EXT = '.lxmc'

export const getAllLists = async() => {
  const lists = []
  lists.push(await getListMusics(defaultList.id).then(musics => ({ ...defaultList, list: toRaw(musics) })))
  lists.push(await getListMusics(loveList.id).then(musics => ({ ...loveList, list: toRaw(musics) })))

  for await (const list of userLists) {
    lists.push(await getListMusics(list.id).then(musics => ({ ...toRaw(list), list: toRaw(musics) })))
  }

  return lists
}

const getTimestamp = () => {
  const date = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/**
 * 清理超出保留数量的旧备份文件（按文件名中的时间戳排序，删除最旧的）
 */
const removeOldBackups = async(dir: string, keepCount: number) => {
  const files = await window.lx.worker.main.readDir(dir)
  const backupFiles = files
    .filter(name => name.startsWith(AUTO_BACKUP_PREFIX) && name.endsWith(AUTO_BACKUP_EXT))
    .sort()
    .reverse()
  for (const name of backupFiles.slice(keepCount)) {
    try {
      await window.lx.worker.main.removeFile(`${dir}/${name}`)
      log.info('[auto backup] removed old backup:', name)
    } catch (err) {
      log.error('[auto backup] remove old backup failed:', name, err)
    }
  }
}

/**
 * 备份全部歌单到自动备份目录（playList_v2 格式），并清理超额旧备份
 */
export const backupPlayLists = async() => {
  // 去除路径末尾的分隔符，避免生成 "D:\/xxx" 这类路径
  const dir = appSetting['backup.autoPath'].replace(/[\\/]+$/, '')
  // 备份目录不存在时自动创建
  const ok = await window.lx.worker.main.checkAndCreateDir(dir)
  if (!ok) throw new Error(`Cannot create backup directory: ${dir}`)
  const data = {
    type: 'playList_v2',
    data: await getAllLists(),
  }
  await window.lx.worker.main.saveLxConfigFile(`${dir}/${AUTO_BACKUP_PREFIX}${getTimestamp()}${AUTO_BACKUP_EXT}`, data)
  await removeOldBackups(dir, Math.max(1, appSetting['backup.autoKeepCount'] || 3))
}

/**
 * 启动软件时，若已开启自动备份且设置了备份路径，则自动备份歌单
 */
export const runAutoBackupIfEnabled = async() => {
  if (!appSetting['backup.autoEnable'] || !appSetting['backup.autoPath']) return
  try {
    await backupPlayLists()
    log.info('[auto backup] playlists backup done')
  } catch (err) {
    log.error('[auto backup] playlists backup failed:', err)
  }
}
