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
      '@': path.join(__dirname, '../../src/main'),
      events: path.join(__dirname, '../../src/main/events'),
      common: path.join(__dirname, '../../src/common'),
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
