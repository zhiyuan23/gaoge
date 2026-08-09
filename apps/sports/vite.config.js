import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyPrefix = env.VITE_APP_API_PREFIX

  return {
    plugins: [vue(), tailwindcss()],
    base: '/',
    build: {
      assetsDir: 'static',
    },
    server: {
      open: true,
      proxy: proxyPrefix
        ? {
            [proxyPrefix]: {
              target: env.VITE_APP_BASE_URL,
              secure: false,
              changeOrigin: command === 'serve' && env.VITE_OPEN_PROXY === 'true',
              rewrite: (requestPath) =>
                requestPath.startsWith(proxyPrefix)
                  ? requestPath.slice(proxyPrefix.length) || '/'
                  : requestPath,
            },
          }
        : undefined,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
    },
  }
})
