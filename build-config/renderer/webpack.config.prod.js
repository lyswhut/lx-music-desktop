const path = require('path')
const { execSync } = require('child_process')
const webpack = require('webpack')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { merge } = require('webpack-merge')

const baseConfig = require('./webpack.config.base')
const buildConfig = require('../webpack-build-config')

// const { dependencies } = require('../../package.json')

// let whiteListedModules = ['vue', 'vue-router', 'vuex', 'vue-i18n']

const gitInfo = {
  commit_id: '',
  commit_date: '',
}

try {
  if (!execSync('git status --porcelain').toString().trim()) {
    gitInfo.commit_id = execSync('git log -1 --pretty=format:"%H"').toString().trim()
    gitInfo.commit_date = execSync('git log -1 --pretty=format:"%ad" --date=iso-strict').toString().trim()
  } else if (process.env.IS_CI) {
    throw new Error('Working directory is not clean')
  }
} catch {}

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
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, '../../src/static'),
          to: path.join(__dirname, '../../dist/static'),
        },
      ],
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
      // ENVIRONMENT: 'process.env',
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      COMMIT_ID: `"${gitInfo.commit_id}"`,
      COMMIT_DATE: `"${gitInfo.commit_date}"`,
    }),
  ],
  optimization: {
    minimize: buildConfig.minimize,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'initial',
      minChunks: 2,
    },
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


