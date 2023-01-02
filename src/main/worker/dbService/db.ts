import Database from 'better-sqlite3'
import path from 'path'
// import migrateData from './migrate'

let db: Database.Database


const initTables = (db: Database.Database) => {
  const sql = `
    CREATE TABLE "db_info" (
      "id" INTEGER NOT NULL UNIQUE,
      "field_name" TEXT,
      "field_value" TEXT,
      PRIMARY KEY("id" AUTOINCREMENT)
    );

    CREATE TABLE "my_list" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "source" TEXT,
      "sourceListId" TEXT,
      "position" INTEGER NOT NULL,
      "locationUpdateTime" INTEGER,
      PRIMARY KEY("id")
    );

    CREATE TABLE "my_list_music_info" (
      "id" TEXT NOT NULL,
      "listId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "singer" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "interval" TEXT,
      "meta" TEXT NOT NULL,
      UNIQUE("id","listId")
    );
    CREATE INDEX "index_my_list_music_info" ON "my_list_music_info" (
      "id",
      "listId"
    );

    CREATE TABLE "my_list_music_info_order" (
      "listId" TEXT NOT NULL,
      "musicInfoId" TEXT NOT NULL,
      "order" INTEGER NOT NULL
    );
    CREATE INDEX "index_my_list_music_info_order" ON "my_list_music_info_order" (
      "listId",
      "musicInfoId"
    );

    CREATE TABLE "music_info_other_source" (
      "source_id" TEXT NOT NULL,
      "id" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "singer" TEXT NOT NULL,
      "meta" TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      UNIQUE("source_id","id")
    );
    CREATE INDEX "index_music_info_other_source" ON "music_info_other_source" (
      "source_id",
      "id"
    );

    -- TODO  "meta" TEXT NOT NULL,
    CREATE TABLE "lyric" (
      "id" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "text" TEXT NOT NULL
    );

    CREATE TABLE "music_url" (
      "id" TEXT NOT NULL,
      "url" TEXT NOT NULL
    );

    CREATE TABLE "download_list" (
      "id" TEXT NOT NULL,
      "isComplate" INTEGER NOT NULL,
      "status" TEXT NOT NULL,
      "statusText" TEXT NOT NULL,
      "progress_downloaded" INTEGER NOT NULL,
      "progress_total" INTEGER NOT NULL,
      "url" TEXT,
      "quality" TEXT NOT NULL,
      "ext" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "filePath" TEXT NOT NULL,
      "musicInfo" TEXT NOT NULL,
      "position" INTEGER NOT NULL,
      PRIMARY KEY("id")
    );

    INSERT INTO "main"."db_info" ("field_name", "field_value") VALUES ('version', '1');
  `

  db.exec(sql)
}


// 打开、初始化数据库
export const init = (lxDataPath: string): boolean => {
  const databasePath = path.join(lxDataPath, 'lx.data.db')
  const nativeBinding = path.join(__dirname, '../node_modules/better-sqlite3/build/Release/better_sqlite3.node')
  let dbFileExists = true

  try {
    db = new Database(databasePath, {
      fileMustExist: true,
      nativeBinding,
      verbose: global.isDev ? console.log : undefined,
    })
  } catch (error) {
    console.log(error)
    db = new Database(databasePath, {
      nativeBinding,
      verbose: global.isDev ? console.log : undefined,
    })
    initTables(db)
    dbFileExists = false
  }

  // if (dbFileExists) migrateData(db)

  // https://www.sqlite.org/pragma.html#pragma_optimize
  if (dbFileExists) db.exec('PRAGMA optimize;')

  // https://www.sqlite.org/lang_vacuum.html
  // db.exec('VACUUM "main"')

  process.on('exit', () => db.close())
  console.log('db inited')
  // require('./test')
  return dbFileExists
}

// 获取数据库实例
export const getDB = (): Database.Database => db
