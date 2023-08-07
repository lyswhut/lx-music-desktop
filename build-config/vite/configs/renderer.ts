import path from 'node:path'
import type { UserConfig } from 'vite'
import { builtinModules } from 'node:module'
import vue from '@vitejs/plugin-vue'
import renderer from 'vite-plugin-electron-renderer'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import postcssConfig from './postcss.config'

const isProd = process.env.NODE_ENV == 'production'
const rootPath = path.join(__dirname, '../../../')

const external = ['electron', ...builtinModules.flatMap(m => [m, `node:${m}`])]

const config: UserConfig = {
  mode: process.env.NODE_ENV == 'production' ? 'production' : 'development',
  root: path.join(rootPath, 'src/renderer'),
  base: './',
  publicDir: isProd ? false : path.join(rootPath, 'src/common/theme'),
  logLevel: 'warn',
  resolve: {
    alias: {
      '@root': path.join(rootPath, 'src'),
      '@common': path.join(rootPath, 'src/common'),
      '@static': path.join(__dirname, 'src/static'),
      '@renderer': path.join(rootPath, 'src/renderer'),
    },
    browserField: true,
  },
  plugins: [
    vue(),
    renderer(),
    createSvgIconsPlugin({
      iconDirs: [path.join(rootPath, 'src/renderer/assets/svgs')],
    }),
  ],
  build: {
    target: 'esnext',
    outDir: path.join(rootPath, 'dist/renderer'),
    modulePreload: false,
    emptyOutDir: true,
    reportCompressedSize: false,
    // assetsDir: 'chunks',
    assetsDir: './',
    minify: false,
    watch: {
      buildDelay: 500,
    },
    rollupOptions: {
      external,
      input: {
        renderer: 'src/renderer/index.html',
      },
      output: {
        entryFileNames: '[name].js',
        format: 'cjs',
        experimentalMinChunkSize: 50_000,
        // manualChunks: {
        //   'iconv-lite': ['iconv-lite'],
        // },
      },
      logLevel: 'warn',
    },
    commonjsOptions: {
      include: [
        /vendors/,
        /node_modules/,
        /utils\/musicMeta/,
      ],
    },
  },
  css: {
    postcss: postcssConfig,
  },
  optimizeDeps: {
  //   // exclude: [],
    include: [
      '@common/utils/musicMeta',
      '@renderer/utils/musicSdk/kg/vendors/infSign.min',
    ],
  },
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV as string}"`,
    'process.env.ELECTRON_DISABLE_SECURITY_WARNINGS': 'true',
    __STATIC_PATH__: `"${path.join(rootPath, 'src/static').replace(/\\/g, '\\\\')}"`,
  },
  server: {
    port: 9080,
  },
  worker: {
    plugins: [renderer()],
    rollupOptions: {
      output: {
        // entryFileNames: '[name].js',
        inlineDynamicImports: true,
        format: 'iife',
        experimentalMinChunkSize: 50_000,
      },
      logLevel: 'warn',
    },
    // format: 'es',
  },
  cacheDir: path.join(rootPath, 'node_modules/.vite/renderer'),
}

export default config
