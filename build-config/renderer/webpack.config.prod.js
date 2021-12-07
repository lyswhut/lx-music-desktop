const path = require('path')
const webpack = require('webpack')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { merge } = require('webpack-merge')

const baseConfig = require('./webpack.config.base')

const { dependencies } = require('../../package.json')

let whiteListedModules = ['vue', 'vue-router', 'vuex', 'vue-i18n']


module.exports = merge(baseConfig, {
  mode: 'production',
  devtool: false,
  externals: [
    ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d)),
  ],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, '../../src/static'),
          to: path.join(__dirname, '../../dist/electron/static'),
        },
      ],
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
    }),
  ],
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
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


