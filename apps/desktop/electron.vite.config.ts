import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: fileURLToPath(new URL('./electron/main/index.ts', import.meta.url)),
        formats: ['cjs'],
      },
      outDir: 'dist/main',
      rollupOptions: {
        output: {
          entryFileNames: '[name].cjs',
          format: 'cjs',
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: fileURLToPath(new URL('./electron/preload/index.ts', import.meta.url)),
        formats: ['cjs'],
      },
      outDir: 'dist/preload',
      rollupOptions: {
        output: {
          entryFileNames: '[name].cjs',
          format: 'cjs',
        },
      },
    },
  },
  renderer: {
    root: '.',
    server: {
      host: '127.0.0.1',
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: 'index.html',
      },
    },
  },
})
