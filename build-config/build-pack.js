/* eslint-disable no-template-curly-in-string */

const builder = require('electron-builder')
const beforePack = require('./build-before-pack')
const afterPack = require('./build-after-pack')

/**
* @type {import('electron-builder').Configuration}
* @see https://www.electron.build/configuration/configuration
*/
const options = {
  appId: 'cn.toside.music.desktop',
  beforePack,
  afterPack,
  protocols: {
    name: 'lx-music-protocol',
    schemes: [
      'lxmusic',
    ],
  },
  directories: {
    buildResources: './resources',
    output: './build',
  },
  files: [
    '!node_modules/**/*',
    'node_modules/font-list',
    'node_modules/better-sqlite3/lib',
    'node_modules/better-sqlite3/package.json',
    'node_modules/better-sqlite3/build/Release/better_sqlite3.node',
    'node_modules/electron-font-manager/index.js',
    'node_modules/electron-font-manager/package.json',
    'node_modules/electron-font-manager/build/Release/font_manager.node',
    'node_modules/node-gyp-build',
    'node_modules/bufferutil',
    'node_modules/utf-8-validate',
    'build/Release/qrc_decode.node',
    'dist/**/*',
  ],
  asar: {
    smartUnpack: false,
  },
  extraResources: [
    './licenses',
  ],
  publish: [
    {
      provider: 'github',
      owner: 'lyswhut',
      repo: 'lx-music-desktop',
    },
  ],
}
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const winOptions = {
  win: {
    icon: './resources/icons/icon.ico',
    legalTrademarks: 'lyswhut',
    // artifactName: '${productName}-v${version}-${env.ARCH}-${env.TARGET}.${ext}',
  },
  nsis: {
    oneClick: false,
    language: '2052',
    allowToChangeInstallationDirectory: true,
    differentialPackage: true,
    license: './licenses/license.rtf',
    shortcutName: 'LX Music',
  },
}
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const linuxOptions = {
  linux: {
    maintainer: 'lyswhut <lyswhut@qq.com>',
    // artifactName: '${productName}-${version}.${env.ARCH}.${ext}',
    icon: './resources/icons',
    category: 'Utility;AudioVideo;Audio;Player;Music;',
    desktop: {
      Name: 'LX Music',
      'Name[zh_CN]': 'LX Music',
      'Name[zh_TW]': 'LX Music',
      Encoding: 'UTF-8',
      MimeType: 'x-scheme-handler/lxmusic',
      StartupNotify: 'false',
    },
  },
  appImage: {
    license: './licenses/license_zh.txt',
    category: 'Utility;AudioVideo;Audio;Player;Music;',
  },
}
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const macOptions = {
  mac: {
    icon: './resources/icons/icon.icns',
    category: 'public.app-category.music',
    // artifactName: '${productName}-${version}.${ext}',
  },
  dmg: {
    window: {
      width: 600,
      height: 400,
    },
    contents: [
      {
        x: 106,
        y: 252,
        name: 'LX Music',
      },
      {
        x: 490,
        y: 252,
        type: 'link',
        path: '/Applications',
      },
    ],
    title: '洛雪音乐助手 v${version}',
  },
}

// win: {
// tagret: {
//   setup: ['nsis', '${productName}-v${version}-${env.ARCH}-Setup.${ext}'],
//   green: ['7z', '${productName}-v${version}-${env.ARCH}-green.${ext}'],
//   portable: ['portable', '${productName}-v${version}-${env.ARCH}-portable.${ext}'],
// },
// },
// linux: {
// platform: Platform.WINDOWS,
// arch: {
//   x64: builder.Arch.x64,
//   arm64: builder.Arch.arm64,
//   armv7l: builder.Arch.armv7l,
// },
// tagret: {
//   deb: ['deb', '${productName}_${version}_${env.ARCH}.${ext}'],
//   appImage: ['AppImage', '${productName}_${version}_${env.ARCH}.${ext}'],
//   pacman: ['pacman', '${productName}_${version}_${env.ARCH}.${ext}'],
//   rpm: ['rpm', '${productName}-${version}.${env.ARCH}.${ext}'],
// },
// },
// mac: {
// arch: {
//   x64: builder.Arch.x64,
//   x86: builder.Arch.ia32,
//   arm64: builder.Arch.arm64,
// },
// tagret: {
//   dmg: ['dmg', '${productName}-${version}-${env.ARCH}.${ext}'],
// },
// },

const createTarget = {
  /**
   *
   * @param {*} arch
   * @param {*} packageType
   * @returns {{ buildOptions: import('electron-builder').CliOptions, options: import('electron-builder').Configuration }}
   */
  win(arch, packageType) {
    switch (packageType) {
      case 'setup':
        winOptions.artifactName = `\${productName}-v\${version}-${arch}-Setup.\${ext}`
        return {
          buildOptions: { win: ['nsis'] },
          options: winOptions,
        }
      case 'green':
        winOptions.artifactName = `\${productName}-v\${version}-win_${arch}-green.\${ext}`
        return {
          buildOptions: { win: ['7z'] },
          options: winOptions,
        }
      case 'win7_green':
        winOptions.artifactName = `\${productName}-v\${version}-win7_${arch}-green.\${ext}`
        return {
          buildOptions: { win: ['7z'] },
          options: winOptions,
        }
      case 'portable':
        winOptions.artifactName = `\${productName}-v\${version}-${arch}-portable.\${ext}`
        return {
          buildOptions: { win: ['portable'] },
          options: winOptions,
        }
      default: throw new Error('Unknown package type: ' + packageType)
    }
  },
  /**
   *
   * @param {*} arch
   * @param {*} packageType
   * @returns {{ buildOptions: import('electron-builder').CliOptions, options: import('electron-builder').Configuration }}
   */
  linux(arch, packageType) {
    switch (packageType) {
      case 'deb':
        linuxOptions.artifactName = `\${productName}_\${version}_${arch == 'x64' ? 'amd64' : arch}.\${ext}`
        return {
          buildOptions: { linux: ['deb'] },
          options: linuxOptions,
        }
      case 'appImage':
        linuxOptions.artifactName = `\${productName}_\${version}_${arch}.\${ext}`
        return {
          buildOptions: { linux: ['AppImage'] },
          options: linuxOptions,
        }
      case 'pacman':
        linuxOptions.artifactName = `\${productName}_\${version}_${arch}.\${ext}`
        return {
          buildOptions: { linux: ['pacman'] },
          options: linuxOptions,
        }
      case 'rpm':
        linuxOptions.artifactName = `\${productName}-\${version}.${arch}.\${ext}`
        return {
          buildOptions: { linux: ['rpm'] },
          options: linuxOptions,
        }
      default: throw new Error('Unknown package type: ' + packageType)
    }
  },
  /**
   *
   * @param {*} arch
   * @param {*} packageType
   * @returns {{ buildOptions: import('electron-builder').CliOptions, options: import('electron-builder').Configuration }}
   */
  mac(arch, packageType) {
    switch (packageType) {
      case 'dmg':
        macOptions.artifactName = `\${productName}-\${version}-${arch}.\${ext}`
        return {
          buildOptions: { mac: ['dmg'] },
          options: macOptions,
        }
      default: throw new Error('Unknown package type: ' + packageType)
    }
  },
}

/**
 *
 * @param {'win' | 'mac' | 'linux' | 'dir'} target 构建目标平台
 * @param {'x86_64' | 'x64' | 'x86' | 'arm64' | 'armv7l'} arch 包架构
 * @param {*} packageType 包类型
 * @param {'onTagOrDraft' | 'always' | 'never'} publishType 发布类型
 */
const build = async(target, arch, packageType, publishType) => {
  if (target == 'dir') {
    await builder.build({
      dir: true,
      config: { ...options, ...winOptions, ...linuxOptions, ...macOptions },
    })
    return
  }
  const targetInfo = createTarget[target](arch, packageType)
  // Promise is returned
  await builder.build({
    ...targetInfo.buildOptions,
    publish: publishType ?? 'never',
    x64: arch == 'x64' || arch == 'x86_64',
    ia32: arch == 'x86' || arch == 'x86_64',
    arm64: arch == 'arm64',
    armv7l: arch == 'armv7l',
    config: { ...options, ...targetInfo.options },
  })
  // .then((result) => {
  //   console.log(JSON.stringify(result))
  // })
  // .catch((error) => {
  //   console.error(error)
  // })
}

const params = {}

for (const param of process.argv.slice(2)) {
  const [name, value] = param.split('=')
  params[name] = value
}

if (params.target == null) throw new Error('Missing target')
if (params.target != 'dir' && params.arch == null) throw new Error('Missing arch')
if (params.target != 'dir' && params.type == null) throw new Error('Missing type')

console.log(params.target, params.arch, params.type, params.publish ?? '')
build(params.target, params.arch, params.type, params.publish)
