import { parentPort, type MessagePort } from 'node:worker_threads'
import { type TaksName, build } from './utils'

import mainConfig from './configs/main'
import rendererConfig from './configs/renderer'
import rendererLyricConfig from './configs/renderer-lyric'
import rendererScriptConfig from './configs/renderer-scripts'

const configs = {
  main: mainConfig,
  renderer: rendererConfig,
  'renderer-lyric': rendererLyricConfig,
  'renderer-scripts': rendererScriptConfig,
}

if (!parentPort) throw new Error('Require run in worker')

parentPort.once('message', ({ port, taskName }: {
  port: MessagePort
  taskName: TaksName
}) => {
  // assert(port instanceof MessagePort)
  const sendStatus = () => {
    port.postMessage({
      status: 'updated',
    })
  }
  void build(configs[taskName], sendStatus).then((status) => {
    port.postMessage({
      status: status ? 'success' : 'error',
    })
  })
})
