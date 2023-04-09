import { getDB } from '../../db'
import {
  createQueryStatement,
  createInsertStatement,
  createDeleteStatement,
  createUpdateStatement,
  createUpdatePositionStatement,
  createClearStatement,
} from './statements'

/**
 * 查询下载歌曲列表
 */
export const queryDownloadList = () => {
  const queryStatement = createQueryStatement()
  return queryStatement.all() as LX.DBService.DownloadMusicInfo[]
}

/**
 * 批量插入下载歌曲并刷新顺序
 * @param mInfos 列表
 */
export const inertDownloadList = (mInfos: LX.DBService.DownloadMusicInfo[], listPositions: Array<{ id: string, position: number }>) => {
  const db = getDB()
  const insertStatement = createInsertStatement()
  const updatePositionStatement = createUpdatePositionStatement()
  db.transaction((mInfos: LX.DBService.DownloadMusicInfo[]) => {
    for (const info of mInfos) insertStatement.run(info)
    for (const info of listPositions) updatePositionStatement.run(info)
  })(mInfos)
}

/**
 * 批量删除下载歌曲
 * @param ids 列表
 */
export const deleteDownloadList = (ids: string[]) => {
  const db = getDB()
  const deleteStatement = createDeleteStatement()
  db.transaction((ids: string[]) => {
    for (const id of ids) deleteStatement.run(id)
  })(ids)
}

/**
 * 批量更新下载歌曲
 * @param urlInfo 列表
 */
export const updateDownloadList = (urlInfo: LX.DBService.DownloadMusicInfo[]) => {
  const db = getDB()
  const updateStatement = createUpdateStatement()
  db.transaction((urlInfo: LX.DBService.DownloadMusicInfo[]) => {
    for (const info of urlInfo) updateStatement.run(info)
  })(urlInfo)
}

/**
 * 清空下载歌曲列表
 */
export const clearDownloadList = () => {
  const clearStatement = createClearStatement()
  clearStatement.run()
}

