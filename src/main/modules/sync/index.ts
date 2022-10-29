// import Event from './event/event'
// import eventNames from './event/name'
import * as modules from './modules'
import { startServer, stopServer, getStatus, generateCode } from './server/server'


export {
  startServer,
  stopServer,
  getStatus,
  generateCode,
  // Event,
  // eventNames,
  modules,
}

export default () => {
  global.lx.event_app.on('main_window_close', () => {
    void stopServer()
  })
}
