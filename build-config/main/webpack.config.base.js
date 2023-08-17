const path = require('path')
const ESLintPlugin = require('eslint-webpack-plugin')

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  target: 'electron-main',
  output: {
    filename: '[name].js',
    library: {
      type: 'commonjs2',
    },
    path: path.join(__dirname, '../../dist'),
  },
  externals: {
    'font-list': 'font-list',
    'better-sqlite3': 'better-sqlite3',
    'electron-font-manager': 'electron-font-manager',
    bufferutil: 'bufferutil',
    'utf-8-validate': 'utf-8-validate',
    'qrc_decode.node': isDev ? path.join(__dirname, '../../build/Release/qrc_decode.node') : path.join('../build/Release/qrc_decode.node'),
  },
  resolve: {
    alias: {
      '@main': path.join(__dirname, '../../src/main'),
      '@renderer': path.join(__dirname, '../../src/renderer'),
      '@lyric': path.join(__dirname, '../../src/renderer-lyric'),
      '@common': path.join(__dirname, '../../src/common'),
    },
    extensions: ['.tsx', '.ts', '.js', '.mjs', '.json', '.node'],
  },
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ESLintPlugin(),
  ],
}
