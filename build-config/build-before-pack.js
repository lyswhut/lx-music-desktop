const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')
const { Arch } = require('electron-builder')

const fileNameMap = {
  [Arch.arm64]: 'arm64',
  [Arch.armv7l]: 'armv7l',
}

const replaceSqliteLib = async(arch) => {
  // console.log(await fs.readdir(path.join(context.appOutDir, './resources/')))
  // if (context.electronPlatformName != 'linux' || context.arch != Arch.arm64) return
  console.log('replace sqlite lib...')
  const filePath = path.join(__dirname, `./lib/better_sqlite3.linux.${fileNameMap[arch]}.node`)
  const targetPath = path.join(__dirname, '../node_modules/better-sqlite3/build/Release/better_sqlite3.node')
  await fsPromises.unlink(targetPath).catch(_ => _)
  await fsPromises.copyFile(filePath, targetPath)
}


module.exports = async(context) => {
  const { electronPlatformName, arch } = context
  if (electronPlatformName !== 'linux') return
  const bindingFilePath = path.join(__dirname, '../node_modules/better-sqlite3/binding.gyp')
  const bindingBakFilePath = path.join(__dirname, '../node_modules/better-sqlite3/binding.gyp.bak')
  switch (arch) {
    case Arch.arm64:
    case Arch.armv7l:
      if (fs.existsSync(bindingFilePath)) {
        console.log('rename binding file...')
        await fsPromises.rename(bindingFilePath, bindingBakFilePath)
      }
      await replaceSqliteLib(arch)
      break

    default:
      if (fs.existsSync(bindingFilePath)) return
      console.log('restore binding file...')
      await fsPromises.rename(bindingBakFilePath, bindingFilePath)
      break
  }
}
