const path = require('path')

module.exports = {
  target: 'electron-main',
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../../dist/electron'),
  },
  externals: [
    // suppress electron-debug warning
    // see https://github.com/SimulatedGREG/electron-vue/issues/498
    { 'electron-debug': 'electron-debug' },
  ],
  resolve: {
    alias: {
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
