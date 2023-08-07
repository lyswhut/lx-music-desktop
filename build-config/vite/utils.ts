import path from 'node:path'
import { Worker, MessageChannel } from 'worker_threads'
import {
  type UserConfig,
  mergeConfig,
  build as viteBuild,
  createServer,
} from 'vite'

export type BuildSuatus = 'success' | 'error' | 'updated'
export type TaksName = 'main' | 'renderer' | 'renderer-lyric' | 'renderer-scripts'

/**
 * build code
 * @param config vite config
 * @param onUpdated new build event
 * @returns is success
 */
export const build = async(config: UserConfig, onUpdated: () => void): Promise<boolean> => {
  if (config.mode == 'production') {
    if (config.build) config.build.watch = null
    return viteBuild(config).then((output) => {
      // output
      // console.log(output)
      return true
    })
  }

  return config.server
    ? createBuildServer(config, onUpdated)
    : buildDev(config, onUpdated)
}


/**
 * build code in dev
 * @param config vite config
 * @param onUpdated new build event
 * @returns is success
 */
const buildDev = async(config: UserConfig, onUpdated: () => void) => {
  return new Promise<boolean>(resolve => {
    let firstBundle = true
    let isError = false
    config = mergeConfig(config, {
      plugins: [
        {
          name: 'vite:file-watcher',
          buildEnd(err?: Error) {
            // console.log('buildEnd', err !== undefined, err)
            isError = err !== undefined
          },
          closeBundle() {
            // console.log('closeBundle')
            if (firstBundle) {
              firstBundle = false
              resolve(!isError)
            } else {
              if (isError) return
              onUpdated()
            }
          },
        },
      ],
    })

    void viteBuild(config)
  })
}

export const createBuildServer = async(config: UserConfig, onUpdated: () => void) => {
  return new Promise<boolean>(resolve => {
    let firstBundle = true
    let isError = false
    void createServer({
      ...mergeConfig(config, {
        plugins: [
          {
            name: 'vite:file-watcher',
            buildEnd(err?: Error) {
              // console.log('buildEnd', err !== undefined, err)
              isError = err !== undefined
            },
            closeBundle() {
              // console.log('closeBundle')
              if (firstBundle) {
                firstBundle = false
                // resolve(!isError)
              } else {
                if (isError) return
                onUpdated()
              }
            },
          },
        ],
      }),
      configFile: false,
    }).then(async server => {
      return server.listen().then(() => {
        resolve(true)
      })
    }).catch((error) => {
      console.log(error)
      resolve(false)
    })

    // return build(config, () => {
    // // server.ws.send({ type: 'full-reload' })
    //   onUpdated()
    // })
  })
}

/**
 * build code in worker
 * @param config vite config
 * @param onUpdated new build event
 * @returns is success
 */
export const runBuildWorker = async(taskName: TaksName, onUpdated: () => void) => new Promise<boolean>((resolve) => {
  const worker = new Worker(path.resolve(__dirname, './worker.ts'), {
    execArgv: ['--require', 'ts-node/register'],
  })
  const subChannel = new MessageChannel()
  worker.postMessage({ port: subChannel.port1, taskName }, [subChannel.port1])
  subChannel.port2.on('message', ({ status }: { status: BuildSuatus }) => {
    // console.log(status)
    switch (status) {
      case 'updated':
        onUpdated()
        break
      case 'success':
        resolve(true)
        break
      case 'error':
        resolve(false)
        break
    }
  })
})
