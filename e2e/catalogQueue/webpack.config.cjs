const path = require('node:path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const root = path.resolve(__dirname, '../..')
const mock = path.join(__dirname, 'mocks.ts')
const alias = { '@renderer': path.join(root, 'src/renderer'), '@common': path.join(root, 'src/common'), vue: 'vue/dist/vue.esm-bundler.js' }
for (const name of ['@renderer/store', '@renderer/store/player/state', '@renderer/store/player/action', '@renderer/store/setting', '@renderer/core/music/version', '@renderer/core/catalog', '@renderer/core/player/action', '@renderer/core/music/sourceCapabilities', '@common/utils/common', '@common/utils/electron', '@renderer/store/utils', '@renderer/utils/musicSdk', '@renderer/core/dislikeList', '@renderer/plugins/i18n', '@renderer/store/list/state', '@renderer/store/list/action', '@renderer/core/player']) alias[`${name}$`] = mock
module.exports = {
  mode: 'development',
  target: 'web',
  devtool: false,
  entry: path.join(__dirname, 'main.ts'),
  output: { path: process.env.LX_CATALOG_UI_OUT || path.join(root, '.validation/catalog-queue-ui'), filename: 'app.js', publicPath: '' },
  resolve: { alias: Object.fromEntries(Object.entries(alias).sort(([a], [b]) => b.length - a.length)), extensions: ['.ts', '.js', '.json', '.vue'] },
  module: {
    rules: [
      { test: /\.vue$/, loader: 'vue-loader' },
      { test: /\.ts$/, loader: 'ts-loader', options: { transpileOnly: true, appendTsSuffixTo: [/\.vue$/], configFile: path.join(root, 'src/renderer/tsconfig.json') } },
      {
        test: /\.(css|less)$/,
        oneOf: [
          { resourceQuery: /module/, use: [MiniCssExtractPlugin.loader, { loader: 'css-loader', options: { modules: { namedExport: false, localIdentName: '[name]_[local]_[hash:base64:5]' } } }, 'less-loader'] },
          { use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader'] },
        ],
      },
    ],
  },
  plugins: [new CopyPlugin({ patterns: [{ from: path.join(__dirname, 'index.html'), to: 'index.html' }] }), new VueLoaderPlugin(), new MiniCssExtractPlugin({ filename: 'style.css' }), new webpack.DefinePlugin({ __VUE_OPTIONS_API__: true, __VUE_PROD_DEVTOOLS__: false }),
    new webpack.NormalModuleReplacementPlugin(/^\.\/(useList|useMusicAdd|useMusicDownload|useMusicActions)$/, resource => { if (resource.context === path.join(root, 'src/renderer/components/material/OnlineList')) resource.request = path.join(__dirname, 'list-fixture.ts') }),
    new webpack.NormalModuleReplacementPlugin(/^\.\/action$/, resource => { if (resource.context === path.join(root, 'src/renderer/core/player')) resource.request = mock }),
    new webpack.NormalModuleReplacementPlugin(/^\.\/utils$/, resource => { if (resource.context === path.join(root, 'src/renderer/core/player')) resource.request = mock }),
  ],
}
