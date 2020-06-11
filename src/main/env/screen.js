const { app, screen } = require('electron')

const initScreenParams = () => {
  global.envParams.workAreaSize = screen.getPrimaryDisplay().workAreaSize
}


app.on('ready', () => {
  screen.on('display-metrics-changed', initScreenParams)
  initScreenParams()
})
