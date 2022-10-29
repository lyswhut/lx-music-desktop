const path = require('path')
const { merge } = require('webpack-merge')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const baseConfig = require('./webpack.config.base')

// const { dependencies } = require('../../package.json')

const buildConfig = require('../webpack-build-config')


module.exports = merge(baseConfig, {
  mode: 'production',
  entry: {
    main: path.join(__dirname, '../../src/main/index.ts'),
    // 'dbService.worker': path.join(__dirname, '../../src/main/worker/dbService/index.ts'),
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, '../../src/main/modules/userApi/renderer/user-api.html'),
          to: path.join(__dirname, '../../dist/userApi/renderer/user-api.html'),
        },
        {
          from: path.join(__dirname, '../../src/common/theme/images/*').replace(/\\/g, '/'),
          to: path.join(__dirname, '../../dist/theme_images/[name][ext]'),
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
    minimize: buildConfig.minimize,
  },
})
