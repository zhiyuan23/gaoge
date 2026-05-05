import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import dayjs from 'dayjs'
import { defineConfig, loadEnv } from 'vite'

import createVitePlugins from './vite/plugins'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())
  // 全局 scss 资源
  const scssResources: string[] = []
  fs.readdirSync('src/assets/styles/resources').forEach((dirname) => {
    if (fs.statSync(`src/assets/styles/resources/${dirname}`).isFile()) {
      scssResources.push(`@use "/src/assets/styles/resources/${dirname}" as *;`)
    }
  })
  return {
    base: '/',
    // 开发服务器选项 https://cn.vitejs.dev/config/server-options
    server: {
      open: true,
      host: true,
      port: 9000,
      proxy: {
        [env.VITE_APP_API_PREFIX]: {
          target: env.VITE_APP_BASE_URL,
          secure: false,
          changeOrigin: command === 'serve' && env.VITE_OPEN_PROXY === 'true',
          rewrite: (path) => path,
          // rewrite: path => path.replace(/^\/api/, '/api'),
        },
      },
    },
    // 构建选项 https://cn.vitejs.dev/config/build-options
    build: {
      outDir: mode === 'production' ? 'dist' : `dist-${mode}`,
      sourcemap: env.VITE_BUILD_SOURCEMAP === 'true',
    },
    define: {
      __SYSTEM_INFO__: JSON.stringify({
        pkg: {
          dependencies: pkg.dependencies,
          devDependencies: pkg.devDependencies,
        },
        lastBuildTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      }),
    },
    plugins: createVitePlugins(mode, command === 'build'),
    resolve: {
      tsconfigPaths: true,
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '#': path.resolve(__dirname, 'src/types'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: scssResources.join(''),
        },
      },
    },
  }
})
