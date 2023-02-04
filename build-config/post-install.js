const { Arch } = require('electron-builder')
require('./build-before-pack')({ electronPlatformName: process.platform, arch: Arch[process.arch] })
