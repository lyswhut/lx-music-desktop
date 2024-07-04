/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

import { app } from 'electron'
import electronDebug from 'electron-debug'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { openDevTools } from './utils'
// Install `electron-debug` with `devtron`
electronDebug({
  showDevTools: false,
  devToolsMode: 'undocked',
})

// Install `vue-devtools`
app.on('ready', () => {
  global.lx.event_app.on('main_window_created', (win) => {
    openDevTools(win.webContents)
    installExtension(VUEJS_DEVTOOLS, { session: win.webContents.session })
      .then((name: string) => {
        console.log(`[main window] Added Extension:  ${name}`)
      })
      .catch((err: Error) => {
        console.log('[main window] An error occurred: ', err)
      })
  })
  global.lx.event_app.on('desktop_lyric_window_created', (win) => {
    openDevTools(win.webContents)
    installExtension(VUEJS_DEVTOOLS, { session: win.webContents.session })
      .then((name: string) => {
        console.log(`[lyric window] Added Extension:  ${name}`)
      })
      .catch((err: Error) => {
        console.log('[lyric window] An error occurred: ', err)
      })
  })
})

// Require `main` process to boot app
require('./index')

