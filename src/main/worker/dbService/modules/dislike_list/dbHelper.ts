// import type Database from 'better-sqlite3'
import { getDB } from '../../db'
import {
  createQueryStatement,
  createInsertStatement,
  // createDeleteStatement,
  // createUpdateStatement,
  createClearStatement,
} from './statements'

/**
 * 查询不喜欢歌曲列表
 */
export const queryDislikeList = () => {
  const queryStatement = createQueryStatement()
  return queryStatement.all() as LX.DBService.DislikeInfo[]
}

/**
 * 批量插入不喜欢歌曲并刷新顺序
 * @param infos 列表
 */
export const insertDislikeList = async(infos: LX.DBService.DislikeInfo[]) => {
  const db = getDB()
  const insertStatement = createInsertStatement()
  db.transaction((infos: LX.DBService.DislikeInfo[]) => {
    for (const info of infos) insertStatement.run(info)
  })(infos)
}

/**
 * 覆盖并批量插入不喜欢歌曲并刷新顺序
 * @param infos 列表
 */
export const overwirteDislikeList = async(infos: LX.DBService.DislikeInfo[]) => {
  const db = getDB()
  const clearStatement = createClearStatement()
  const insertStatement = createInsertStatement()
  db.transaction((infos: LX.DBService.DislikeInfo[]) => {
    clearStatement.run()
    for (const info of infos) insertStatement.run(info)
  })(infos)
}

// /**
//  * 批量删除不喜欢歌曲
//  * @param ids 列表
//  */
// export const deleteDislikeList = (ids: string[]) => {
//   const db = getDB()
//   const deleteStatement = createDeleteStatement()
//   db.transaction((ids: string[]) => {
//     for (const id of ids) deleteStatement.run(BigInt(id))
//   })(ids)
// }

// /**
//  * 批量更新不喜欢歌曲
//  * @param urlInfo 列表
//  */
// export const updateDislikeList = async(infos: LX.DBService.DislikeInfo[]) => {
//   const db = getDB()
//   const updateStatement = createUpdateStatement()
//   db.transaction((infos: LX.DBService.DislikeInfo[]) => {
//     for (const info of infos) updateStatement.run(info)
//   })(infos)
// }

// /**
//  * 清空不喜欢歌曲列表
//  */
// export const clearDislikeList = () => {
//   const clearStatement = createClearStatement()
//   clearStatement.run()
// }

