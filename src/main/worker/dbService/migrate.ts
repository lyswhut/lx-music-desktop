import Database from 'better-sqlite3'

const migrateV1 = (db: Database.Database) => {
  db.exec('DROP TABLE "main"."download_list"')
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
  db.prepare('UPDATE "main"."db_info" SET "field_value"=@value WHERE "field_name"=@name').run({ name: 'version', value: '2' })
}

export default (db: Database.Database) => {
  const version = db.prepare('SELECT "field_value" FROM "main"."db_info" WHERE "field_name" = ?').get('version').field_value
  switch (version) {
    case '1':
      migrateV1(db)
      break
  }
}
