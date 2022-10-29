import { app } from 'electron'
import { unRegisterHotkeyAll } from './utils'

import init from './rendererEvent'

export default () => {
  app.on('will-quit', unRegisterHotkeyAll)
  init()
}
