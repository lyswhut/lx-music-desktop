const fs = require('fs')
const path = require('path')
const tar = require('tar')

const libDir = path.join(__dirname, 'lib')

const getGzipFiles = async() => {
  const names = await fs.promises.readdir(libDir)
  for (const name of names) {
    if (name.endsWith('.node')) await fs.promises.unlink(path.join(libDir, name))
  }
  return names.filter(name => name.endsWith('.gz'))
}

const unzip = async(filePath) => {
  const targetDir = filePath.replace('.tar.gz', '')
  if (fs.existsSync(targetDir)) await fs.promises.rm(targetDir, { recursive: true })
  await fs.promises.mkdir(targetDir)
  await tar.x({
    file: filePath,
    strip: 1,
    C: targetDir,
  })
  return targetDir
}

const files = [
  'qrc_decode',
  'better_sqlite3',
]
const moveFile = async(filePath) => {
  const name = 'electron-' + path.basename(filePath).split('-electron-')[1]
  for (const fileName of files) {
    if (fileName == 'better_sqlite3' && !name.includes('linux')) continue
    const targetPath = path.join(libDir, `${fileName}_${name}.node`)
    if (fs.existsSync(targetPath)) await fs.promises.unlink(targetPath)
    await fs.promises.rename(path.join(filePath, 'Release', fileName + '.node'), targetPath)
  }
  await fs.promises.rm(filePath, { recursive: true })
}

const run = async() => {
  const files = await getGzipFiles()
  for (const name of files) {
    await moveFile(await unzip(path.join(libDir, name)))
  }
  for (const name of files) {
    await fs.promises.unlink(path.join(libDir, name))
  }
}

run()

