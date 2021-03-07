const path = require('path')
const { merge } = require('webpack-merge')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

const baseConfig = require('./webpack.config.base')


module.exports = merge(baseConfig, {
  mode: 'development',
  entry: {
    main: path.join(__dirname, '../../src/main/index.dev.js'),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"',
      },
      __static: `"${path.join(__dirname, '../../src/static').replace(/\\/g, '\\\\')}"`,
      __userApi: `"${path.join(__dirname, '../../src/main/modules/userApi').replace(/\\/g, '\\\\')}"`,
    }),
    new FriendlyErrorsPlugin({
      onErrors(severity, errors) { // Silent warning from electron-debug
        if (severity != 'warning') return

        for (let i = errors.length - 1; i > -1; i--) {
          const error = errors[i]
          if (error.file == './node_modules/electron-debug/index.js') errors.splice(i, 1)
        }
        // You can listen to errors transformed and prioritized by the plugin
        // severity can be 'error' or 'warning'
      },
    }),
  ],
})
