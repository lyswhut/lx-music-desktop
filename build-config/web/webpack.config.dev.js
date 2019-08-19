const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

const baseConfig = require('./webpack.config.base')

const { mergeCSSLoaderDev } = require('../utils')

module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: 'eval-source-map',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '../../dist/web'),
  },
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
        test: /\.styl$/,
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
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"',
      },
    }),
    new FriendlyErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  performance: {
    hints: false,
  },
})

