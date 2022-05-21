const path = require('path')
const { merge } = require('webpack-merge')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const baseConfig = require('./webpack.config.base')

const { dependencies } = require('../../package.json')


module.exports = merge(baseConfig, {
  mode: 'production',
  entry: {
    main: path.join(__dirname, '../../src/main/index.js'),
  },
  externals: [
    ...Object.keys(dependencies || {}),
    // 'font-list',
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, '../../src/main/modules/userApi/renderer'),
          to: path.join(__dirname, '../../dist/userApi/renderer'),
        },
        {
          from: path.join(__dirname, '../../src/main/modules/userApi/rendererEvent/name.js'),
          to: path.join(__dirname, '../../dist/userApi/rendererEvent/name.js'),
        },
      ],
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
  ],
  performance: {
    maxEntrypointSize: 1024 * 1024 * 10,
    maxAssetSize: 1024 * 1024 * 20,
  },
  optimization: {
    minimize: false,
  },
})
