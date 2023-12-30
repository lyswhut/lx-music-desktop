// const path = require('path')
const webpack = require('webpack')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { merge } = require('webpack-merge')

const baseConfig = require('./webpack.config.base')
const buildConfig = require('../webpack-build-config')

// const { dependencies } = require('../../package.json')

// let whiteListedModules = ['vue']
// let whiteListedModules = ['vue', 'vue-router', 'vuex', 'vue-i18n']


module.exports = merge(baseConfig, {
  mode: 'production',
  devtool: 'source-map',
  externals: [
    // ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d)),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    }),
  ],
  optimization: {
    minimize: buildConfig.minimize,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
  performance: {
    maxEntrypointSize: 1024 * 1024 * 10,
    maxAssetSize: 1024 * 1024 * 20,
    hints: 'warning',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
})


