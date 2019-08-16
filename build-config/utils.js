const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const cssLoaderConfig = require('./css-loader.config')
const chalk = require('chalk')

// merge css-loader in development
exports.mergeCSSLoaderDev = beforeLoader => {
  const loader = [
    // 这里匹配 `<style module>`
    {
      resourceQuery: /module/,
      use: [
        'vue-style-loader',
        {
          loader: 'css-loader',
          options: Object.assign({
            sourceMap: true,
          }, cssLoaderConfig),
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
          },
        },
      ],
    },
    // 这里匹配普通的 `<style>` 或 `<style scoped>`
    {
      use: [
        'vue-style-loader',
        {
          loader: 'css-loader',
          options: {
            sourceMap: true,
          },
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
          },
        },
      ],
    },
  ]
  if (beforeLoader) {
    loader[0].use.push(beforeLoader)
    loader[1].use.push(beforeLoader)
  }
  return loader
}

// merge css-loader in production
exports.mergeCSSLoaderProd = beforeLoader => {
  const loader = [
    // 这里匹配 `<style module>`
    {
      resourceQuery: /module/,
      use: [
        MiniCssExtractPlugin.loader,
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
        MiniCssExtractPlugin.loader,
        'css-loader',
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

