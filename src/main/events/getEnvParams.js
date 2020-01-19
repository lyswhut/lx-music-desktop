const { mainHandle } = require('../../common/ipc')

mainHandle('getEnvParams', async(event, options) => {
  return global.envParams
})

