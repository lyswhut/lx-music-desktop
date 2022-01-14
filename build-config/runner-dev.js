process.env.NODE_ENV = 'development'

const chalk = require('chalk')
const electron = require('electron')
const path = require('path')
// const { say } = require('cfonts')
const { spawn } = require('child_process')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpackHotMiddleware = require('webpack-hot-middleware')

const mainConfig = require('./main/webpack.config.dev')
const rendererConfig = require('./renderer/webpack.config.dev')
const rendererLyricConfig = require('./renderer-lyric/webpack.config.dev')

let electronProcess = null
let manualRestart = false
let hotMiddlewareRenderer
let hotMiddlewareRendererLyric


function startRenderer() {
  return new Promise((resolve, reject) => {
    // rendererConfig.entry.renderer = [path.join(__dirname, 'dev-client')].concat(rendererConfig.entry.renderer)
    // rendererConfig.mode = 'development'
    const compiler = webpack(rendererConfig)
    hotMiddlewareRenderer = webpackHotMiddleware(compiler, {
      log: false,
      heartbeat: 2500,
    })

    compiler.hooks.compilation.tap('compilation', compilation => {
      // console.log(Object.keys(compilation.hooks))
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('html-webpack-plugin-after-emit', (data, cb) => {
        hotMiddlewareRenderer.publish({ action: 'reload' })
        cb()
      })
    })

    // compiler.hooks.done.tap('done', stats => {
    //   // logStats('Renderer', 'Compile done')
    //   // logStats('Renderer', stats)
    // })

    const server = new WebpackDevServer({
      port: 9080,
      hot: true,
      historyApiFallback: true,
      // static: {
      //   directory: path.join(__dirname, '../'),
      // },
      client: {
        logging: 'warn',
        overlay: true,
      },
      setupMiddlewares(middlewares, devServer) {
        devServer.app.use(hotMiddlewareRenderer)
        devServer.middleware.waitUntilValid(resolve)

        return middlewares
      },
    }, compiler)

    server.start()
  })
}

function startRendererLyric() {
  return new Promise((resolve, reject) => {
    // rendererConfig.entry.renderer = [path.join(__dirname, 'dev-client')].concat(rendererConfig.entry.renderer)
    // rendererConfig.mode = 'development'
    const compiler = webpack(rendererLyricConfig)
    hotMiddlewareRendererLyric = webpackHotMiddleware(compiler, {
      log: false,
      heartbeat: 2500,
    })

    compiler.hooks.compilation.tap('compilation', compilation => {
      // console.log(Object.keys(compilation.hooks))
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync('html-webpack-plugin-after-emit', (data, cb) => {
        hotMiddlewareRendererLyric.publish({ action: 'reload' })
        cb()
      })
    })

    // compiler.hooks.done.tap('done', stats => {
    //   // logStats('Renderer', 'Compile done')
    //   // logStats('Renderer', stats)
    // })

    const server = new WebpackDevServer({
      port: 9081,
      hot: true,
      historyApiFallback: true,
      // static: {
      //   directory: path.join(__dirname, '../'),
      // },
      client: {
        logging: 'warn',
        overlay: true,
      },
      setupMiddlewares(middlewares, devServer) {
        devServer.app.use(hotMiddlewareRenderer)
        devServer.middleware.waitUntilValid(resolve)
        return middlewares
      },
    }, compiler)

    server.start()
  })
}

function startMain() {
  return new Promise((resolve, reject) => {
    // mainConfig.entry.main = [path.join(__dirname, '../src/main/index.dev.js')].concat(mainConfig.entry.main)
    // mainConfig.mode = 'development'
    const compiler = webpack(mainConfig)

    compiler.hooks.watchRun.tapAsync('watch-run', (compilation, done) => {
      hotMiddlewareRenderer.publish({ action: 'compiling' })
      hotMiddlewareRendererLyric.publish({ action: 'compiling' })
      done()
    })

    compiler.watch({}, (err, stats) => {
      if (err) {
        console.log(err)
        return
      }

      // logStats('Main', stats)

      if (electronProcess && electronProcess.kill) {
        manualRestart = true
        process.kill(electronProcess.pid)
        electronProcess = null
        startElectron()

        setTimeout(() => {
          manualRestart = false
        }, 5000)
      }

      resolve()
    })
  })
}

function startElectron() {
  let args = [
    '--inspect=5858',
    // 'NODE_ENV=development',
    path.join(__dirname, '../dist/electron/main.js'),
  ]

  // detect yarn or npm and process commandline args accordingly
  if (process.env.npm_execpath.endsWith('yarn.js')) {
    args = args.concat(process.argv.slice(3))
  } else if (process.env.npm_execpath.endsWith('npm-cli.js')) {
    args = args.concat(process.argv.slice(2))
  }

  electronProcess = spawn(electron, args)

  electronProcess.stdout.on('data', data => {
    electronLog(data, 'blue')
  })
  electronProcess.stderr.on('data', data => {
    electronLog(data, 'red')
  })

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit()
  })
}

function electronLog(data, color) {
  let log = data.toString()
  if (/[0-9A-z]+/.test(log)) {
    // 抑制 user api 窗口使用 data url 加载页面时 vue扩展 的报错日志刷屏的问题
    if (color == 'red' && typeof log === 'string' && log.includes('"Extension server error: Operation failed: Permission denied", source: devtools://devtools/bundled/extensions/extensions.js')) return

    console.log(chalk[color](log))
  }
}

function init() {
  const Spinnies = require('spinnies')
  const spinners = new Spinnies({ color: 'blue' })
  spinners.add('main', { text: 'main compiling' })
  spinners.add('renderer', { text: 'renderer compiling' })
  spinners.add('renderer-lyric', { text: 'renderer-lyric compiling' })
  function handleSuccess(name) {
    spinners.succeed(name, { text: name + ' compile success!' })
  }
  function handleFail(name) {
    spinners.fail(name, { text: name + ' compile fail!' })
  }

  Promise.all([
    startRenderer().then(() => handleSuccess('renderer')).catch((err) => {
      console.error(err.message)
      return handleFail('renderer')
    }),
    startRendererLyric().then(() => handleSuccess('renderer-lyric')).catch((err) => {
      console.error(err.message)
      return handleFail('renderer-lyric')
    }),
    startMain().then(() => handleSuccess('main')).catch(() => handleFail('main')),
  ]).then(startElectron).catch(err => {
    console.error(err)
  })
}

init()
