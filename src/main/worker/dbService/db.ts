import Database from 'better-sqlite3'
import path from 'path'
// import migrateData from './migrate'

let db: Database.Database


const initTables = (db: Database.Database) => {
  db.exec(`
    CREATE TABLE "db_info" (
      "id" INTEGER NOT NULL UNIQUE,
      "field_name" TEXT,
      "field_value" TEXT,
      PRIMARY KEY("id" AUTOINCREMENT)
    )`)

  db.prepare(`INSERT INTO "main"."db_info" ("field_name", "field_value") VALUES
      ('version', '1')
    `).run()

  db.exec(`
    CREATE TABLE "my_list" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "source" TEXT,
      "sourceListId" TEXT,
      "position" INTEGER NOT NULL,
      "locationUpdateTime" INTEGER,
      PRIMARY KEY("id")
    )`)
  // const insert = db.prepare(`INSERT INTO "main"."my_list" ("id", "name", "source", "sourceListId", "locationUpdateTime") VALUES
  //     (@id, @name, @source, @sourceListId, @locationUpdateTime)`)
  // db.transaction((cats) => {
  //   for (const cat of cats) insert.run(cat)
  // })([
  //   { id: 'default', name: '默认列表', source: null, sourceListId: null, locationUpdateTime: null },
  //   { id: 'love', name: '收藏列表', source: null, sourceListId: null, locationUpdateTime: null },
  //   { id: 'temp', name: '临时列表', source: null, sourceListId: null, locationUpdateTime: null },
  // ])
  db.exec(`
    CREATE TABLE "my_list_music_info" (
      "id" TEXT NOT NULL,
      "listId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "singer" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "interval" TEXT,
      "meta" TEXT NOT NULL,
      UNIQUE("id","listId")
    )`)
  db.exec(`
    CREATE INDEX "index_my_list_music_info" ON "my_list_music_info" (
      "id",
      "listId"
    )`)

  db.exec(`
    CREATE TABLE "my_list_music_info_order" (
      "listId" TEXT NOT NULL,
      "musicInfoId" TEXT NOT NULL,
      "order" INTEGER NOT NULL
    )`)
  db.exec(`
    CREATE INDEX "index_my_list_music_info_order" ON "my_list_music_info_order" (
      "listId",
      "musicInfoId"
    )`)

  db.exec(`
    CREATE TABLE "music_info_other_source" (
      "source_id" TEXT NOT NULL,
      "id" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "singer" TEXT NOT NULL,
      "meta" TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      UNIQUE("source_id","id")
    )`)
  db.exec(`
    CREATE INDEX "index_music_info_other_source" ON "music_info_other_source" (
      "source_id",
      "id"
    )`)

  // TODO  "meta" TEXT NOT NULL,
  db.exec(`
    CREATE TABLE "lyric" (
      "id" TEXT NOT NULL,
      "source" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "text" TEXT NOT NULL
    )`)

  db.exec(`
    CREATE TABLE "music_url" (
      "id" TEXT NOT NULL,
      "url" TEXT NOT NULL
    )`)

  db.exec(`
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
    )`)
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
  db.exec('PRAGMA optimize;')

  // https://www.sqlite.org/lang_vacuum.html
  // db.exec('VACUUM "main"')

  process.on('exit', () => db.close())
  console.log('db inited')
  // require('./test')
  return dbFileExists
}

// 获取数据库实例
export const getDB = (): Database.Database => db
