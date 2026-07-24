const path = require('path')
const webpack = require('webpack')

const config = {
  target: 'electron-renderer',
  entry: {
    'renderer-lyric': path.join(__dirname, 'src/renderer-lyric/main.ts'),
  },
  output: {
    filename: '[name].js',
    library: { type: 'commonjs2' },
    path: path.join(__dirname, 'dist-test'),
  },
  resolve: {
    alias: {
      '@root': path.join(__dirname, 'src'),
      '@main': path.join(__dirname, 'src/main'),
      '@renderer': path.join(__dirname, 'src/renderer'),
      '@lyric': path.join(__dirname, 'src/renderer-lyric'),
      '@static': path.join(__dirname, 'src/static'),
      '@common': path.join(__dirname, 'src/common'),
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
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"',
        ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      },
    }),
  ],
  mode: 'development',
}

webpack(config, (err, stats) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  const info = stats.toJson({ all: false, errors: true, warnings: true })
  if (stats.hasErrors()) {
    console.log('=== ERRORS ===')
    info.errors.forEach((e, i) => {
      console.log(`[${i + 1}]`, e.message)
    })
  } else {
    console.log('No errors!')
  }
})