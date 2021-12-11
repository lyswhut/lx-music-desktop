/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */
const electron = require('electron')
const electronDebug = require('electron-debug')
const { default: installExtension, VUEJS3_DEVTOOLS } = require('electron-devtools-installer')
// Install `electron-debug` with `devtron`
electronDebug({
  showDevTools: true,
  devToolsMode: 'undocked',
})

// Install `vue-devtools`
electron.app.on('ready', () => {
  installExtension(VUEJS3_DEVTOOLS)
    .then(name => console.log(`Added Extension:  ${name}`))
    .catch(err => console.log('An error occurred: ', err))
})

// Require `main` process to boot app
require('./index')

