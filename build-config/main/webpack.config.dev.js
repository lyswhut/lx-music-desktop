const path = require('path')
const { merge } = require('webpack-merge')
const webpack = require('webpack')

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
  ],
  performance: {
    maxEntrypointSize: 1024 * 1024 * 50,
    maxAssetSize: 1024 * 1024 * 30,
  },
})
