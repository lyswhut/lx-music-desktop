import path from 'node:path'
import type { UserConfig } from 'vite'
import { builtinModules } from 'node:module'
import vue from '@vitejs/plugin-vue'
import renderer from 'vite-plugin-electron-renderer'
import postcssConfig from './postcss.config'

// const isProd = process.env.NODE_ENV == 'production'
const rootPath = path.join(__dirname, '../../../')

const external = ['electron', ...builtinModules.flatMap(m => [m, `node:${m}`])]

const config: UserConfig = {
  mode: process.env.NODE_ENV == 'production' ? 'production' : 'development',
  root: path.join(rootPath, 'src/renderer-lyric'),
  base: './',
  publicDir: false,
  logLevel: 'warn',
  resolve: {
    alias: {
      '@root': path.join(rootPath, 'src'),
      '@common': path.join(rootPath, 'src/common'),
      '@static': path.join(__dirname, 'src/static'),
      '@lyric': path.join(rootPath, 'src/renderer-lyric'),
    },
    browserField: true,
  },
  plugins: [vue(), renderer()],
  build: {
    target: 'esnext',
    outDir: path.join(rootPath, 'dist/renderer-lyric'),
    modulePreload: false,
    emptyOutDir: true,
    reportCompressedSize: false,
    assetsDir: './',
    // assetsDir: 'chunks',
    minify: false,
    watch: {
      buildDelay: 500,
    },
    rollupOptions: {
      external,
      input: {
        'renderer-lyric': 'src/renderer-lyric/index.html',
      },
      output: {
        entryFileNames: '[name].js',
        format: 'cjs',
        // manualChunks(id, info) {
        //   return 'renderer'
        // },
        experimentalMinChunkSize: 50_000,
      },
      logLevel: 'warn',
    },
  },
  css: {
    postcss: postcssConfig,
  },
  optimizeDeps: {
    include: [],
  },
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV as string}"`,
    'process.env.ELECTRON_DISABLE_SECURITY_WARNINGS': 'true',
    __STATIC_PATH__: `"${path.join(rootPath, 'src/static').replace(/\\/g, '\\\\')}"`,
  },
  server: {
    port: 9081,
  },
  cacheDir: path.join(rootPath, 'node_modules/.vite/renderer-lyric'),
}

export default config
