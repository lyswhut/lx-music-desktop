/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

import { app } from 'electron'
import electronDebug from 'electron-debug'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
// Install `electron-debug` with `devtron`
electronDebug({
  showDevTools: true,
  devToolsMode: 'undocked',
})

// Install `vue-devtools`
app.on('ready', () => {
  installExtension(VUEJS_DEVTOOLS)
    .then((name: string) => {
      console.log(`Added Extension:  ${name}`)
    })
    .catch((err: Error) => {
      console.log('An error occurred: ', err)
    })
})

// Require `main` process to boot app
require('./index')

