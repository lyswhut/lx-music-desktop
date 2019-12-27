const { log } = require('./utils')

process.on('uncaughtException', function(err) {
  console.error('An uncaught error occurred!')
  console.error(err)
  log.error(err)
})
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise ', p)
  console.error(' reason: ', reason)
  log.error(reason)
})
