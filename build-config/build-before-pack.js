const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')
const { Arch } = require('electron-builder')
const nodeAbi = require('node-abi')

const better_sqlite3_fileNameMap = {
  [Arch.x64]: 'linux-x64',
  [Arch.arm64]: 'linux-arm64',
  [Arch.armv7l]: 'linux-arm',
}

const replaceSqliteLib = async(electronNodeAbi, arch) => {
  // console.log(await fs.readdir(path.join(context.appOutDir, './resources/')))
  // if (context.electronPlatformName != 'linux' || context.arch != Arch.arm64) return
  // https://github.com/lyswhut/lx-music-desktop/issues/1102
  // https://github.com/lyswhut/lx-music-desktop/issues/1161
  console.log('replace sqlite lib...')
  const filePath = path.join(__dirname, `./lib/better_sqlite3_electron-v${electronNodeAbi}-${better_sqlite3_fileNameMap[arch]}.node`)
  console.log(filePath)
  const targetPath = path.join(__dirname, '../node_modules/better-sqlite3/build/Release/better_sqlite3.node')
  await fsPromises.unlink(targetPath).catch(_ => _)
  await fsPromises.copyFile(filePath, targetPath)
}


module.exports = async(context) => {
  const { electronPlatformName, arch } = context
  const electronVersion = context.packager?.info?._framework?.version ?? require('../package.json').devDependencies.electron.replace(/^[^\d]*?(\d+)/, '$1')
  const electronNodeAbi = nodeAbi.getAbi(electronVersion, 'electron')
  if (electronPlatformName !== 'linux' || process.env.FORCE) return
  const bindingFilePath = path.join(__dirname, '../node_modules/better-sqlite3/binding.gyp')
  const bindingBakFilePath = path.join(__dirname, '../node_modules/better-sqlite3/binding.gyp.bak')
  switch (arch) {
    case Arch.x64:
    case Arch.arm64:
    case Arch.armv7l:
      if (fs.existsSync(bindingFilePath)) {
        // console.log('rename binding file...')
        await fsPromises.rename(bindingFilePath, bindingBakFilePath)
      }
      await replaceSqliteLib(electronNodeAbi, arch)
      break

    default:
      if (fs.existsSync(bindingFilePath)) return
      // console.log('restore binding file...')
      await fsPromises.rename(bindingBakFilePath, bindingFilePath)
      break
  }
}
