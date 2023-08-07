import path from 'node:path'
import type { UserConfig } from 'vite'
import { builtinModules } from 'node:module'

// const isProd = process.env.NODE_ENV == 'production'
const rootPath = path.join(__dirname, '../../../')

const config: UserConfig = {
  mode: process.env.NODE_ENV,
  root: path.join(rootPath, 'src/main'),
  base: './',
  publicDir: false,
  logLevel: 'warn',
  resolve: {
    alias: {
      '@root': path.join(rootPath, 'src'),
      '@common': path.join(rootPath, 'src/common'),
      '@static': path.join(__dirname, 'src/static'),
    },
    browserField: true,
  },
  build: {
    lib: {
      entry: 'modules/userApi/renderer/preload.js',
      formats: ['cjs'],
      fileName: 'user-api-preload',
    },
    outDir: path.join(rootPath, 'dist/preload'),
    modulePreload: {
      polyfill: false,
    },
    emptyOutDir: true,
    reportCompressedSize: false,
    // assetsDir: 'chunks',
    minify: false,
    watch: {
      buildDelay: 500,
    },
    rollupOptions: {
      external: ['electron', ...builtinModules.flatMap(m => [m, `node:${m}`])],
      input: {
        'user-api-preload': 'src/main/modules/userApi/renderer/preload.js',
      },
      output: {
        entryFileNames: '[name].js',
        // manualChunks(id, info) {
        // //   return 'main'
        // },
        experimentalMinChunkSize: 50_000,
      },
      logLevel: 'warn',
    },
  },
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV as string}"`,
    __STATIC_PATH__: `"${path.join(rootPath, 'src/static').replace(/\\/g, '\\\\')}"`,
  },
  cacheDir: path.join(rootPath, 'node_modules/.vite/scripts'),
}

export default config
