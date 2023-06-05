// const { getAvailableFontFamilies } = require('electron-font-manager')


// exports.getAvailableFontFamilies = getAvailableFontFamilies

import { getFonts as getFontsByCommand } from 'font-list'
import { getAvailableFontFamilies } from 'electron-font-manager'


const getFonts = async() => {
  switch (process.platform) {
    case 'win32':
    case 'darwin':
      return getAvailableFontFamilies()
    default: return getFontsByCommand()
  }
}

export {
  getFonts,
}
