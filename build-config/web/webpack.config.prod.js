const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const merge = require('webpack-merge')
const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const baseConfig = require('./webpack.config.base')

const { mergeCSSLoaderProd } = require('../utils')


module.exports = merge(baseConfig, {
  mode: 'production',
  devtool: false,
  output: {
    filename: '[name].[chunkhash:8].js',
  },
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
        test: /\.styl$/,
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
        to: path.join(__dirname, '../dist/web/static'),
        ignore: ['.*'],
      },
    ]),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contentHash:8].css',
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
    splitChunks: {
      cacheGroups: {
        // chunks: 'all',
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          enforce: true,
          chunks: 'all',
        },
        styles: {
          name: 'styles',
          test: /\.(css|less)$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
    runtimeChunk: true,
  },
  performance: {
    hints: 'warning',
  },
})
