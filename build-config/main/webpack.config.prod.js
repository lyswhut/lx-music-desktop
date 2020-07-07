const path = require('path')
const { merge } = require('webpack-merge')
const webpack = require('webpack')

const baseConfig = require('./webpack.config.base')

const { dependencies } = require('../../package.json')


module.exports = merge(baseConfig, {
  mode: 'production',
  entry: {
    main: path.join(__dirname, '../../src/main/index.js'),
  },
  externals: [
    ...Object.keys(dependencies || {}),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
  ],
})
