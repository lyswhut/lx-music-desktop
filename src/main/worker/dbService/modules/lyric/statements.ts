import { getDB } from '../../db'

const RAW_LYRIC = 'raw'
const EDITED_LYRIC = 'edited'

/**
 * 创建歌词查询语句
 * @returns 查询语句
 */
export const createLyricQueryStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    SELECT "type", "text", "source"
    FROM "main"."lyric"
    WHERE "id"=?
    `)
}

/**
 * 创建原始歌词查询语句
 * @returns 查询语句
 */
export const createRawLyricQueryStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    SELECT "type", "text"
    FROM "main"."lyric"
    WHERE "id"=? AND "source"='${RAW_LYRIC}'
    `)
}

/**
 * 创建原始歌词插入语句
 * @returns 插入语句
 */
export const createRawLyricInsertStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.Lyricnfo]>(`
    INSERT INTO "main"."lyric" ("id", "type", "text", "source")
    VALUES (@id, @type, @text, '${RAW_LYRIC}')`)
}

/**
 * 创建原始歌词清空语句
 * @returns 清空语句
 */
export const createRawLyricClearStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`
    DELETE FROM "main"."lyric"
    WHERE "source"='${RAW_LYRIC}'
  `)
}

/**
 * 创建原始歌词删除语句
 * @returns 删除语句
 */
export const createRawLyricDeleteStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    DELETE FROM "main"."lyric"
    WHERE "id"=? AND "source"='${RAW_LYRIC}'
  `)
}

/**
 * 创建原始歌词更新语句
 * @returns 更新语句
 */
export const createRawLyricUpdateStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.Lyricnfo]>(`
    UPDATE "main"."lyric"
    SET "text"=@text
    WHERE "id"=@id AND "source"='${RAW_LYRIC}' AND "type"=@type`)
}


/**
 * 创建原始歌词数量统计语句
 * @returns 统计语句
 */
export const createRawLyricCountStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`SELECT COUNT(*) as count FROM "main"."lyric" WHERE "source"='${RAW_LYRIC}'`)
}


/**
 * 创建已编辑歌词查询语句
 * @returns 查询语句
 */
export const createEditedLyricQueryStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    SELECT "type", "text"
    FROM "main"."lyric"
    WHERE "id"=? AND "source"='${EDITED_LYRIC}'
    `)
}

/**
 * 创建已编辑歌词插入语句
 * @returns 插入语句
 */
export const createEditedLyricInsertStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.Lyricnfo]>(`
    INSERT INTO "main"."lyric" ("id", "type", "text", "source")
    VALUES (@id, @type, @text, '${EDITED_LYRIC}')`)
}

/**
 * 创建已编辑歌词清空语句
 * @returns 清空语句
 */
export const createEditedLyricClearStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`
    DELETE FROM "main"."lyric"
    WHERE "source"='${EDITED_LYRIC}'
  `)
}

/**
 * 创建已编辑歌词删除语句
 * @returns 删除语句
 */
export const createEditedLyricDeleteStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    DELETE FROM "main"."lyric"
    WHERE "id"=? AND "source"='${EDITED_LYRIC}'
  `)
}

/**
 * 创建已编辑歌词更新语句
 * @returns 更新语句
 */
export const createEditedLyricUpdateStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.Lyricnfo]>(`
    UPDATE "main"."lyric"
    SET "text"=@text
    WHERE "id"=@id AND "source"='${EDITED_LYRIC}' AND "type"=@type`)
}

/**
 * 创建已编辑歌词数量统计语句
 * @returns 统计语句
 */
export const createEditedLyricCountStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`SELECT COUNT(*) as count FROM "main"."lyric" WHERE "source"='${EDITED_LYRIC}'`)
}
