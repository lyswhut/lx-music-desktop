import { getDB } from '../../db'

/**
 * 创建歌曲url查询语句
 * @returns 查询语句
 */
export const createQueryStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    SELECT "url"
    FROM "main"."music_url"
    WHERE "id"=?
    `)
}

/**
 * 创建歌曲url插入语句
 * @returns 插入语句
 */
export const createInsertStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.MusicUrlInfo]>(`
    INSERT INTO "main"."music_url" ("id", "url")
    VALUES (@id, @url)`)
}

/**
 * 创建歌曲url清空语句
 * @returns 清空语句
 */
export const createClearStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`
    DELETE FROM "main"."music_url"
  `)
}

/**
 * 创建歌曲url删除语句
 * @returns 删除语句
 */
export const createDeleteStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    DELETE FROM "main"."music_url"
    WHERE "id"=?
  `)
}

/**
 * 创建歌曲url更新语句
 * @returns 更新语句
 */
export const createUpdateStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.MusicUrlInfo]>(`
    UPDATE "main"."music_url"
    SET "url"=@url
    WHERE "id"=@id`)
}

/**
 * 创建数量统计语句
 * @returns 统计语句
 */
export const createCountStatement = () => {
  const db = getDB()
  return db.prepare<[]>('SELECT COUNT(*) as count FROM "main"."music_url"')
}
