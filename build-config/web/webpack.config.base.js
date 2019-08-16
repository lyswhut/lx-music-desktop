const path = require('path')
const webpack = require('webpack')
const HTMLPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const vueLoaderConfig = require('../vue-loader.config')

module.exports = {
  target: 'web',
  entry: path.join(__dirname, '../../src/renderer/main.js'),
  output: {
    path: path.join(__dirname, '../../dist/web'),
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, '../../src/renderer'),
      common: path.join(__dirname, '../../src/common'),
    },
    extensions: ['*', '.js', '.vue', '.json', '.css'],
  },
  module: {
    rules: [
      {
        test: /\.(vue|js)$/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-formatter-friendly'),
          },
        },
        exclude: /node_modules/,
        enforce: 'pre',
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig,
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.pug$/,
        oneOf: [
          // Use pug-plain-loader handle .vue file
          {
            resourceQuery: /vue/,
            use: ['pug-plain-loader'],
          },
          // Use pug-loader handle .pug file
          {
            use: ['pug-loader'],
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'imgs/[name].[ext]',
          },
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'fonts/[name].[ext]',
          },
        },
      },
    ],
  },
  performance: {
    maxEntrypointSize: 300000,
  },
  plugins: [
    new VueLoaderPlugin(),
    new HTMLPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, '../../src/index.pug'),
      nodeModules: false,
      isProd: process.env.NODE_ENV == 'production',
      browser: process.browser,
      __dirname,
    }),
    new webpack.DefinePlugin({
      'process.env.IS_WEB': 'true',
    }),
  ],
}
