const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')
const { Arch } = require('electron-builder')

const better_sqlite3_fileNameMap = {
  [Arch.arm64]: 'arm64.glibc27',
  [Arch.armv7l]: 'armv7l',
}

const qrc_decode_fileNameMap = {
  win32: {
    [Arch.x64]: 'windows.x64',
    [Arch.ia32]: 'windows.x86',
    [Arch.arm64]: 'windows.arm64',
  },
  linux: {
    [Arch.x64]: 'linux.x64',
    [Arch.arm64]: 'linux.arm64',
    [Arch.armv7l]: 'linux.armv7l',
  },
  darwin: {
    [Arch.x64]: 'mac.x86',
    [Arch.arm64]: 'mac.arm64',
  },
}

const replaceSqliteLib = async(arch) => {
  // console.log(await fs.readdir(path.join(context.appOutDir, './resources/')))
  // if (context.electronPlatformName != 'linux' || context.arch != Arch.arm64) return
  // https://github.com/lyswhut/lx-music-desktop/issues/1102
  // https://github.com/lyswhut/lx-music-desktop/issues/1161
  console.log('replace sqlite lib...')
  const filePath = path.join(__dirname, `./lib/better_sqlite3.linux.${better_sqlite3_fileNameMap[arch]}.node`)
  const targetPath = path.join(__dirname, '../node_modules/better-sqlite3/build/Release/better_sqlite3.node')
  await fsPromises.unlink(targetPath).catch(_ => _)
  await fsPromises.copyFile(filePath, targetPath)
}

const replaceQrcDecodeLib = async(platform, arch) => {
  console.log('replace qrc_decode lib...', platform, qrc_decode_fileNameMap[platform][arch])
  const filePath = path.join(__dirname, `./lib/qrc_decode.${qrc_decode_fileNameMap[platform][arch]}.node`)
  const targetPath = path.join(__dirname, '../build/Release/qrc_decode.node')
  const targetDir = path.dirname(targetPath)
  if (fs.existsSync(targetDir)) await fsPromises.unlink(targetPath).catch(_ => _)
  else await fsPromises.mkdir(targetDir, { recursive: true })
  await fsPromises.copyFile(filePath, targetPath)
}


module.exports = async(context) => {
  const { electronPlatformName, arch } = context
  await replaceQrcDecodeLib(electronPlatformName, arch)
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
