process.env.NODE_ENV = 'production'

const chalk = require('chalk')
const del = require('del')
const webpack = require('webpack')
const Multispinner = require('multispinner')

const mainConfig = require('./main/webpack.config.prod')
const rendererConfig = require('./renderer/webpack.config.prod')

const errorLog = chalk.bgRed.white(' ERROR ') + ' '
const okayLog = chalk.bgGreen.white(' OKAY ') + ' '


function build() {
  del.sync(['dist/electron', 'build'])

  const tasks = ['main', 'renderer']
  const m = new Multispinner(tasks, {
    preText: 'building',
    postText: 'process',
  })

  let results = ''

  m.on('success', () => {
    process.stdout.write('\x1B[2J\x1B[0f')
    console.log(`\n\n${results}`)
    console.log(`${okayLog}take it away ${chalk.yellow('`electron-builder`')}\n`)
    process.exit()
  })

  pack(mainConfig).then(result => {
    results += result + '\n\n'
    m.success('main')
  }).catch(err => {
    m.error('main')
    console.log(`\n  ${errorLog}failed to build main process`)
    console.error(`\n${err}\n`)
    process.exit(1)
  })

  pack(rendererConfig).then(result => {
    results += result + '\n\n'
    m.success('renderer')
  }).catch(err => {
    m.error('renderer')
    console.log(`\n  ${errorLog}failed to build renderer process`)
    console.error(`\n${err}\n`)
    process.exit(1)
  })
}

function pack(config) {
  return new Promise((resolve, reject) => {
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

build()

