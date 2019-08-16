const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const merge = require('webpack-merge')

const baseConfig = require('./webpack.config.base')

const { mergeCSSLoaderProd } = require('../utils')
const { dependencies } = require('../../package.json')

let whiteListedModules = ['vue']


module.exports = merge(baseConfig, {
  mode: 'production',
  devtool: false,
  externals: [
    ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d)),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        oneOf: mergeCSSLoaderProd(),
      },
      {
        test: /\.less$/,
        oneOf: mergeCSSLoaderProd({
          loader: 'less-loader',
          options: {
            sourceMap: true,
          },
        }),
      },
      {
        test: /\.styl(:?us)?$/,
        oneOf: mergeCSSLoaderProd({
          loader: 'stylus-loader',
          options: {
            sourceMap: true,
          },
        }),
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, '../../src/static'),
        to: path.join(__dirname, '../../dist/electron/static'),
        ignore: ['.*'],
      },
    ]),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new webpack.NamedChunksPlugin(),
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: false, // set to true if you want JS source maps
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  performance: {
    hints: 'warning',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
})


