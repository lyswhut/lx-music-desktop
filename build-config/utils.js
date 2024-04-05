const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const cssLoaderConfig = require('./css-loader.config')
const chalk = require('chalk')

// merge css-loader
exports.mergeCSSLoader = beforeLoader => {
  const loader = [
    // 这里匹配 `<style module>`
    {
      resourceQuery: /module/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            esModule: false,
          },
        },
        {
          loader: 'css-loader',
          options: cssLoaderConfig,
        },
        'postcss-loader',
      ],
    },
    // 这里匹配普通的 `<style>` 或 `<style scoped>`
    {
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            esModule: false,
          },
        },
        {
          loader: 'css-loader',
          options: {
            esModule: false,
          },
        },
        'postcss-loader',
      ],
    },
  ]
  if (beforeLoader) {
    loader[0].use.push(beforeLoader)
    loader[1].use.push(beforeLoader)
  }
  return loader
}

exports.logStats = (proc, data) => {
  let log = ''

  log += chalk.yellow.bold(`${proc} Process：`)
  log += '\n'

  if (typeof data === 'object') {
    data.toString({
      colors: true,
      chunks: false,
    }).split(/\r?\n/).forEach(line => {
      log += '  ' + line + '\n'
    })
  } else {
    log += `  ${data}\n`
  }

  console.log(log)
}

exports.debounce = (fn, delay = 100) => {
  let timer = null
  let _args
  return (...args) => {
    _args = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(..._args)
    }, delay)
  }
}
