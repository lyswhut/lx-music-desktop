import { getDB } from '../../db'
import {
  createQueryStatement,
  createInsertStatement,
  createDeleteStatement,
  // createUpdateStatement,
  createClearStatement,
  createCountStatement,
} from './statements'

/**
 * 查询歌曲url
 * @param id 歌曲id
 * @returns url
 */
export const queryMusicUrl = (id: string) => {
  const queryStatement = createQueryStatement()
  return (queryStatement.get(id) as { url: string } | null)?.url ?? null
}

/**
 * 批量插入歌曲url
 * @param urlInfo 列表
 */
export const insertMusicUrl = (urlInfo: LX.DBService.MusicUrlInfo[]) => {
  const db = getDB()
  const insertStatement = createInsertStatement()
  const deleteStatement = createDeleteStatement()
  db.transaction((urlInfo: LX.DBService.MusicUrlInfo[]) => {
    for (const info of urlInfo) {
      deleteStatement.run(info.id)
      insertStatement.run(info)
    }
  })(urlInfo)
}

/**
 * 批量删除歌曲url
 * @param ids 列表
 */
export const deleteMusicUrl = (ids: string[]) => {
  const db = getDB()
  const deleteStatement = createDeleteStatement()
  db.transaction((ids: string[]) => {
    for (const id of ids) deleteStatement.run(id)
  })(ids)
}

/**
 * 批量更新歌曲url
 * @param urlInfo 列表
 */
// export const updateMusicUrl = (urlInfo: LX.DBService.MusicUrlInfo[]) => {
//   const db = getDB()
//   const updateStatement = createUpdateStatement()
//   db.transaction((urlInfo: LX.DBService.MusicUrlInfo[]) => {
//     for (const info of urlInfo) updateStatement.run(info)
//   })(urlInfo)
// }

/**
 * 清空歌曲url
 */
export const clearMusicUrl = () => {
  const clearStatement = createClearStatement()
  clearStatement.run()
}

/**
 * 统计歌曲信息数量
 */
export const countMusicUrl = () => {
  const countStatement = createCountStatement()
  return (countStatement.get() as { count: number }).count
}
