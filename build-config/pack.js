process.env.NODE_ENV = 'production'

const chalk = require('chalk')
const del = require('del')
const webpack = require('webpack')
const Spinnies = require('spinnies')

const mainConfig = './main/webpack.config.prod'
const rendererConfig = './renderer/webpack.config.prod'
const rendererLyricConfig = './renderer-lyric/webpack.config.prod'
const rendererScriptConfig = './renderer-scripts/webpack.config.prod'

const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgGreen.white(' OKAY ') + ' '

const { Worker, isMainThread, parentPort } = require('worker_threads')


function build() {
  console.time('build')
  del.sync(['dist/**', 'build/**'])

  const spinners = new Spinnies({ color: 'blue' })
  spinners.add('main', { text: 'main building' })
  spinners.add('renderer', { text: 'renderer building' })
  spinners.add('renderer-lyric', { text: 'renderer-lyric building' })
  spinners.add('renderer-scripts', { text: 'renderer-scripts building' })
  let results = ''

  // m.on('success', () => {
  //   process.stdout.write('\x1B[2J\x1B[0f')
  //   console.log(`\n\n${results}`)
  //   console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`)
  //   process.exit()
  // })
  function handleSuccess() {
    process.stdout.write('\x1B[2J\x1B[0f')
    console.log(`\n\n${results}`)
    console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`)
    console.timeEnd('build')
    process.exit()
  }

  Promise.all([
    pack(mainConfig).then(result => {
      results += result + '\n\n'
      spinners.succeed('main', { text: 'main build success!' })
    }).catch(err => {
      spinners.fail('main', { text: 'main build fail :(' })
      console.log(`\n  ${errorLog}failed to build main process`)
      console.error(`\n${err}\n`)
      process.exit(1)
    }),
    pack(rendererConfig).then(result => {
      results += result + '\n\n'
      spinners.succeed('renderer', { text: 'renderer build success!' })
    }).catch(err => {
      spinners.fail('renderer', { text: 'renderer build fail :(' })
      console.log(`\n  ${errorLog}failed to build renderer process`)
      console.error(`\n${err}\n`)
      process.exit(1)
    }),
    pack(rendererLyricConfig).then(result => {
      results += result + '\n\n'
      spinners.succeed('renderer-lyric', { text: 'renderer-lyric build success!' })
    }).catch(err => {
      spinners.fail('renderer-lyric', { text: 'renderer-lyric build fail :(' })
      console.log(`\n  ${errorLog}failed to build renderer-lyric process`)
      console.error(`\n${err}\n`)
      process.exit(1)
    }),
    pack(rendererScriptConfig).then(result => {
      results += result + '\n\n'
      spinners.succeed('renderer-scripts', { text: 'renderer-scripts build success!' })
    }).catch(err => {
      spinners.fail('renderer-scripts', { text: 'renderer-scripts build fail :(' })
      console.log(`\n  ${errorLog}failed to build renderer-scripts process`)
      console.error(`\n${err}\n`)
      process.exit(1)
    }),
  ]).then(handleSuccess)
}

function pack(config) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename)
    const subChannel = new MessageChannel()
    worker.postMessage({ port: subChannel.port1, config }, [subChannel.port1])
    subChannel.port2.on('message', ({ status, message }) => {
      switch (status) {
        case 'success': return resolve(message)
        case 'error': return reject(message)
      }
    })
  })
}

function runPack(config) {
  return new Promise((resolve, reject) => {
    config = require(config)
    config.mode = 'production'
    webpack(config, (err, stats) => {
      if (err) reject(err.stack || err)
      else if (stats.hasErrors()) {
        let err = ''

        stats.toString({
          chunks: false,
          modules: false,
          colors: true,
        })
          .split(/\r?\n/)
          .forEach(line => {
            err += `    ${line}\n`
          })

        reject(err)
      } else {
        resolve(stats.toString({
          chunks: false,
          colors: true,
        }))
      }
    })
  })
}

if (isMainThread) build()
else {
  parentPort.once('message', ({ port, config }) => {
    // assert(port instanceof MessagePort)
    runPack(config).then((result) => {
      port.postMessage({
        status: 'success',
        message: result,
      })
    }).catch((err) => {
      port.postMessage({
        status: 'error',
        message: err,
      })
    }).finally(() => {
      port.close()
    })
  })
}
