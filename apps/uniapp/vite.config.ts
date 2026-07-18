import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import type { UserConfig } from 'vite'
import { createLogger, defineConfig, loadEnv } from 'vite'

import { createViteProxy } from './build/config/index'
import createVitePlugins from './build/plugins/index'

export default defineConfig(({ mode }): UserConfig => {
  const env = loadEnv(mode, process.cwd())
  const isBuild = process.env.NODE_ENV === 'production'
  const proxy = createViteProxy(env)
  const logger = createLogger()
  const originalWarn = logger.warn

  logger.warn = (msg, options) => {
    if (
      typeof msg === 'string' &&
      msg.includes('"virtual:uno.css" is being imported multiple times in different files')
    )
      return
    originalWarn(msg, options)
  }

  const server: NonNullable<UserConfig['server']> = {
    port: Number.parseInt(env.VITE_APP_PORT ?? '5173', 10),
    hmr: true,
    host: true,
    open: true,
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/unpackage/**'],
    },
  }

  if (proxy) {
    server.proxy = proxy
  }

  return {
    customLogger: logger,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server,
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    build: {
      minify: 'terser',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      terserOptions: {
        compress: {
          drop_console: isBuild,
          drop_debugger: isBuild,
        },
      },
    },
    plugins: createVitePlugins(isBuild),
    esbuild: { drop: isBuild ? ['console', 'debugger'] : [] },
  }
})
