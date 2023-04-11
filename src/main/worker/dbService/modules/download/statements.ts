import { getDB } from '../../db'

/**
 * 创建下载列表查询语句
 * @returns 查询语句
 */
export const createQueryStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`
    SELECT "id", "isComplate", "status", "statusText", "progress_downloaded", "progress_total", "url", "quality", "ext", "fileName", "filePath", "musicInfo", "position"
    FROM download_list
    ORDER BY "position" ASC
  `)
}

/**
 * 创建下载记录插入语句
 * @returns 插入语句
 */
export const createInsertStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.DownloadMusicInfo]>(`
    INSERT INTO "main"."download_list" ("id", "isComplate", "status", "statusText", "progress_downloaded", "progress_total", "url", "quality", "ext", "fileName", "filePath", "musicInfo", "position")
    VALUES (@id, @isComplate, @status, @statusText, @progress_downloaded, @progress_total, @url, @quality, @ext, @fileName, @filePath, @musicInfo, @position)`)
}

/**
 * 创建下载记录清空语句
 * @returns 清空语句
 */
export const createClearStatement = () => {
  const db = getDB()
  return db.prepare<[]>(`
    DELETE FROM "main"."download_list"
  `)
}

/**
 * 创建下载记录删除语句
 * @returns 删除语句
 */
export const createDeleteStatement = () => {
  const db = getDB()
  return db.prepare<[string]>(`
    DELETE FROM "main"."download_list"
    WHERE "id"=?
  `)
}

/**
 * 创建下载记录更新语句
 * @returns 更新语句
 */
export const createUpdateStatement = () => {
  const db = getDB()
  return db.prepare<[LX.DBService.DownloadMusicInfo]>(`
    UPDATE "main"."download_list"
    SET "isComplate"=@isComplate, "status"=@status, "statusText"=@statusText, "progress_downloaded"=@progress_downloaded, "progress_total"=@progress_total, "url"=@url, "filePath"=@filePath
    WHERE "id"=@id`)
}

/**
 * 创建下载记录顺序更新语句
 * @returns 更新语句
 */
export const createUpdatePositionStatement = () => {
  const db = getDB()
  return db.prepare<[{ id: string, position: number }]>(`
    UPDATE "main"."download_list"
    SET "position"=@position
    WHERE "id"=@id`)
}
