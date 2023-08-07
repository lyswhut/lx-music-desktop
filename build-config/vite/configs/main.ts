import path from 'node:path'
import type { UserConfig } from 'vite'
import { builtinModules } from 'node:module'

const isProd = process.env.NODE_ENV == 'production'

const rootPath = path.join(__dirname, '../../../')


const config: UserConfig = {
  mode: process.env.NODE_ENV == 'production' ? 'production' : 'development',
  root: path.join(rootPath, 'src/main'),
  base: './',
  publicDir: false,
  logLevel: 'warn',
  resolve: {
    alias: {
      '@root': path.join(rootPath, 'src'),
      '@common': path.join(rootPath, 'src/common'),
      '@static': path.join(__dirname, 'src/static'),
      '@main': path.join(rootPath, 'src/main'),
    },
    browserField: false,
  },
  build: {
    lib: {
      entry: `${isProd ? 'index.ts' : 'index-dev.ts'}`,
      formats: ['cjs'],
      fileName: 'main',
    },
    outDir: path.join(rootPath, 'dist/main'),
    emptyOutDir: true,
    reportCompressedSize: false,
    modulePreload: false,
    // assetsDir: 'chunks',
    minify: false,
    watch: {
      buildDelay: 500,
    },
    commonjsOptions: {
      dynamicRequireTargets: ['*.js'],
      ignoreDynamicRequires: true,
    },
    rollupOptions: {
      external: [
        'electron',
        'better-sqlite3',
        'font-list',
        'electron-font-manager',
        ...builtinModules.flatMap(m => [m, `node:${m}`]),
      ],
      input: {
        main: `src/main/${isProd ? 'index.ts' : 'index-dev.ts'}`,
        'dbService.worker': 'src/main/worker/dbService/index.ts',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        format: 'cjs',
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
    __USER_API_PATH__: `"${path.join(rootPath, 'src/main/modules/userApi').replace(/\\/g, '\\\\')}"`,
    __QRC_DECODE_NODE_PATH__: `"${(isProd ? '../../build/Release' : path.join(rootPath, 'build/Release')).replace(/\\/g, '\\\\')}"`,
  },
  cacheDir: path.join(rootPath, 'node_modules/.vite/main'),
}

export default config
