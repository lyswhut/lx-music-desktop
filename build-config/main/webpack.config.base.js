const path = require('path')

module.exports = {
  target: 'electron-main',
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../../dist/electron'),
  },
  resolve: {
    alias: {
      '@main': path.join(__dirname, '../../src/main'),
      '@renderer': path.join(__dirname, '../../src/renderer'),
      '@lyric': path.join(__dirname, '../../src/renderer-lyric'),
      '@common': path.join(__dirname, '../../src/common'),
    },
    extensions: ['*', '.js', '.json', '.node'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-formatter-friendly'),
          },
        },
        exclude: /node_modules/,
        enforce: 'pre',
      },
      // {
      //   test: /\.js$/,
      //   loader: 'babel-loader',
      //   exclude: /node_modules/,
      // },
    ],
  },
  performance: {
    maxEntrypointSize: 300000,
  },
}
