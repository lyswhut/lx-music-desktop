const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

const merge = require('webpack-merge')

const baseConfig = require('./webpack.config.base')

const { mergeCSSLoaderDev } = require('../utils')

module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        oneOf: mergeCSSLoaderDev(),
      },
      {
        test: /\.less$/,
        oneOf: mergeCSSLoaderDev({
          loader: 'less-loader',
          options: {
            sourceMap: true,
          },
        }),
      },
      {
        test: /\.styl(:?us)?$/,
        oneOf: mergeCSSLoaderDev({
          loader: 'stylus-loader',
          options: {
            sourceMap: true,
          },
        }),
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new FriendlyErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"',
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      },
      __static: `"${path.join(__dirname, '../../src/static').replace(/\\/g, '\\\\')}"`,
    }),
  ],
  performance: {
    hints: false,
  },
})

