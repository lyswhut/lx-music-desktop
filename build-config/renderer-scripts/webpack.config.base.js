const path = require('path')
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = {
  target: 'electron-renderer',
  entry: {
    'user-api-preload': path.join(__dirname, '../../src/main/modules/userApi/renderer/preload.js'),
  },
  output: {
    filename: '[name].js',
    library: {
      type: 'commonjs2',
    },
    path: path.join(__dirname, '../../dist'),
    publicPath: '',
  },
  resolve: {
    alias: {
      '@root': path.join(__dirname, '../../src'),
      '@main': path.join(__dirname, '../../src/main'),
      '@renderer': path.join(__dirname, '../../src/renderer'),
      '@lyric': path.join(__dirname, '../../src/renderer-lyric'),
      '@static': path.join(__dirname, '../../src/static'),
      '@common': path.join(__dirname, '../../src/common'),
    },
    extensions: ['.tsx', '.ts', '.js', '.json', '.node'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/],
          },
        },
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      },
    ],
  },
  plugins: [
    new ESLintPlugin({
      extensions: ['js'],
      formatter: require('eslint-formatter-friendly'),
    }),
  ],
}
