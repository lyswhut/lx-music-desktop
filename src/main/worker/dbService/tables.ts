// export const sql = `
//   CREATE TABLE "db_info" (
//     "id" INTEGER NOT NULL UNIQUE,
//     "field_name" TEXT,
//     "field_value" TEXT,
//     PRIMARY KEY("id" AUTOINCREMENT)
//   );

//   CREATE TABLE "my_list" (
//     "id" TEXT NOT NULL,
//     "name" TEXT NOT NULL,
//     "source" TEXT,
//     "sourceListId" TEXT,
//     "position" INTEGER NOT NULL,
//     "locationUpdateTime" INTEGER,
//     PRIMARY KEY("id")
//   );

//   CREATE TABLE "my_list_music_info" (
//     "id" TEXT NOT NULL,
//     "listId" TEXT NOT NULL,
//     "name" TEXT NOT NULL,
//     "singer" TEXT NOT NULL,
//     "source" TEXT NOT NULL,
//     "interval" TEXT,
//     "meta" TEXT NOT NULL,
//     UNIQUE("id","listId")
//   );
//   CREATE INDEX "index_my_list_music_info" ON "my_list_music_info" (
//     "id",
//     "listId"
//   );

//   CREATE TABLE "my_list_music_info_order" (
//     "listId" TEXT NOT NULL,
//     "musicInfoId" TEXT NOT NULL,
//     "order" INTEGER NOT NULL
//   );
//   CREATE INDEX "index_my_list_music_info_order" ON "my_list_music_info_order" (
//     "listId",
//     "musicInfoId"
//   );

//   CREATE TABLE "music_info_other_source" (
//     "source_id" TEXT NOT NULL,
//     "id" TEXT NOT NULL,
//     "source" TEXT NOT NULL,
//     "name" TEXT NOT NULL,
//     "singer" TEXT NOT NULL,
//     "meta" TEXT NOT NULL,
//     "order" INTEGER NOT NULL,
//     UNIQUE("source_id","id")
//   );
//   CREATE INDEX "index_music_info_other_source" ON "music_info_other_source" (
//     "source_id",
//     "id"
//   );

//   -- TODO  "meta" TEXT NOT NULL,
//   CREATE TABLE "lyric" (
//     "id" TEXT NOT NULL,
//     "source" TEXT NOT NULL,
//     "type" TEXT NOT NULL,
//     "text" TEXT NOT NULL
//   );

//   CREATE TABLE "music_url" (
//     "id" TEXT NOT NULL,
//     "url" TEXT NOT NULL
//   );

//   CREATE TABLE "download_list" (
//     "id" TEXT NOT NULL,
//     "isComplate" INTEGER NOT NULL,
//     "status" TEXT NOT NULL,
//     "statusText" TEXT NOT NULL,
//     "progress_downloaded" INTEGER NOT NULL,
//     "progress_total" INTEGER NOT NULL,
//     "url" TEXT,
//     "quality" TEXT NOT NULL,
//     "ext" TEXT NOT NULL,
//     "fileName" TEXT NOT NULL,
//     "filePath" TEXT NOT NULL,
//     "musicInfo" TEXT NOT NULL,
//     "position" INTEGER NOT NULL,
//     PRIMARY KEY("id")
//   );
// `

// export const tables = [
//   'table_db_info',
//   'table_my_list',
//   'table_my_list_music_info',
//   'index_index_my_list_music_info',
//   'table_my_list_music_info_order',
//   'index_index_my_list_music_info_order',
//   'table_music_info_other_source',
//   'index_index_music_info_other_source',
//   'table_lyric',
//   'table_music_url',
//   'table_download_list',
// ]

type Tables = 'db_info'
| 'my_list'
| 'my_list_music_info'
| 'index_my_list_music_info'
| 'my_list_music_info_order'
| 'index_my_list_music_info_order'
| 'music_info_other_source'
| 'index_music_info_other_source'
| 'lyric'
| 'music_url'
| 'download_list'
| 'dislike_list'

const tables = new Map<Tables, string>()


tables.set('db_info', `
  CREATE TABLE "db_info" (
    "id" INTEGER NOT NULL UNIQUE,
    "field_name" TEXT,
    "field_value" TEXT,
    PRIMARY KEY("id" AUTOINCREMENT)
  );
`)
tables.set('my_list', `
  CREATE TABLE "my_list" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT,
    "sourceListId" TEXT,
    "position" INTEGER NOT NULL,
    "locationUpdateTime" INTEGER,
    PRIMARY KEY("id")
  );
`)
tables.set('my_list_music_info', `
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
`)
tables.set('index_my_list_music_info', `
  CREATE INDEX "index_my_list_music_info" ON "my_list_music_info" (
    "id",
    "listId"
  );
`)
tables.set('my_list_music_info_order', `
  CREATE TABLE "my_list_music_info_order" (
    "listId" TEXT NOT NULL,
    "musicInfoId" TEXT NOT NULL,
    "order" INTEGER NOT NULL
  );
`)
tables.set('index_my_list_music_info_order', `
  CREATE INDEX "index_my_list_music_info_order" ON "my_list_music_info_order" (
    "listId",
    "musicInfoId"
  );
`)
tables.set('music_info_other_source', `
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
`)
tables.set('index_music_info_other_source', `
  CREATE INDEX "index_music_info_other_source" ON "music_info_other_source" (
    "source_id",
    "id"
  );
`)
tables.set('lyric', `
  -- TODO  "meta" TEXT NOT NULL,
  CREATE TABLE "lyric" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL
  );
`)
tables.set('music_url', `
  CREATE TABLE "music_url" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL
  );
`)
tables.set('download_list', `
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
`)
tables.set('dislike_list', `
  CREATE TABLE "dislike_list" (
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meta" TEXT
  );
`)

export default tables

export const DB_VERSION = '2'
