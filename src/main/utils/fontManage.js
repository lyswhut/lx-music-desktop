// const { getAvailableFontFamilies } = require('electron-font-manager')


// exports.getAvailableFontFamilies = getAvailableFontFamilies


const fontList = require('font-list')

exports.getFonts = fontList.getFonts
