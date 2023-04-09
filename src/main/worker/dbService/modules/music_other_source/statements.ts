import { getDB } from '../../db'


/**
 * 创建歌曲信息查询语句
 * @returns 查询语句
 */
export const createMusicInfoQueryStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    SELECT "id", "name", "singer", "source", "meta"
    FROM "main"."music_info_other_source"
    WHERE source_id=?
    ORDER BY "order" ASC
  `)
}

/**
 * 创建歌曲信息插入语句
 * @returns 插入语句
 */
export const createMusicInfoInsertStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.MusicInfoOtherSource]>(`
    INSERT INTO "main"."music_info_other_source" ("id", "name", "singer", "source", "meta", "source_id", "order")
    VALUES (@id, @name, @singer, @source, @meta, @source_id, @order)
  `)
}

/**
 * 创建歌曲信息清空语句
 * @returns 清空语句
 */
export const createMusicInfoClearStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`
    DELETE FROM "main"."music_info_other_source"
  `)
}

/**
 * 创建歌曲信息删除语句
 * @returns 删除语句
 */
export const createMusicInfoDeleteStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    DELETE FROM "main"."music_info_other_source"
    WHERE "source_id"=?
  `)
}

/**
 * 创建数量统计语句
 * @returns 统计语句
 */
export const createCountStatement = () => {
  const db = getDB()
  return db.prepare<[]>('SELECT COUNT(*) as count FROM "main"."music_info_other_source"')
}
