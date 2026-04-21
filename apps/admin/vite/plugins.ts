import path from 'node:path'
import process from 'node:process'
import vueLegacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import boxen from 'boxen'
import picocolors from 'picocolors'
import Unocss from 'unocss/vite'
import autoImport from 'unplugin-auto-import/vite'
import TurboConsole from 'unplugin-turbo-console/vite'
import components from 'unplugin-vue-components/vite'
import { loadEnv, type PluginOption } from 'vite'
import AppLoading from 'vite-plugin-app-loading'
import Archiver from 'vite-plugin-archiver'
import banner from 'vite-plugin-banner'
import { compression } from 'vite-plugin-compression2'
import { envParse, parseLoadedEnv } from 'vite-plugin-env-parse'
import { vitePluginFakeServer } from 'vite-plugin-fake-server'
import Pages from 'vite-plugin-pages'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import VueDevTools from 'vite-plugin-vue-devtools'

export default function createVitePlugins(mode: string, isBuild = false) {
  const viteEnv = parseLoadedEnv(loadEnv(mode, process.cwd()))
  const vitePlugins: (PluginOption | PluginOption[])[] = [
    vue(),
    vueJsx(),
    vueLegacy({
      renderLegacyChunks: false,
      modernPolyfills: ['es.array.at', 'es.array.find-last', 'es.object.has-own'],
    }),

    // https://github.com/vuejs/devtools-next
    viteEnv.VITE_OPEN_DEVTOOLS && VueDevTools(),

    envParse({
      dtsPath: 'src/types/env.d.ts',
    }),

    // https://github.com/unplugin/unplugin-auto-import
    autoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: './src/types/auto-imports.d.ts',
      dirs: ['./src/composables/**'],
    }),

    // https://github.com/unplugin/unplugin-vue-components
    components({
      globs: [
        'src/ui/components/*/index.vue',
        'src/components/*/index.vue',
        'src/components/*/*/index.vue',
      ],
      dts: './src/types/components.d.ts',
    }),

    Unocss(),

    // https://github.com/vbenjs/vite-plugin-svg-icons
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons/')],
      symbolId: 'icon-[dir]-[name]',
      svgoOptions: isBuild,
    }),

    // https://github.com/condorheroblog/vite-plugin-fake-server
    vitePluginFakeServer({
      logger: !isBuild,
      include: 'src/mock',
      infixName: false,
      enableProd: isBuild && viteEnv.VITE_BUILD_MOCK,
    }),

    // 仅保留 <route> 自定义块解析，不再以文件系统路由作为运行时入口
    Pages({
      dirs: [
        {
          dir: 'src/views',
          baseRoute: '',
          filePattern: '{index,login,reload,[...all]}.vue',
        },
        {
          dir: 'src/views/gaoge',
          baseRoute: 'gaoge',
          filePattern: '**/*.vue',
        },
      ],
      exclude: ['**/components/**/*.vue'],
    }),

    // https://github.com/nonzzz/vite-plugin-compression
    viteEnv.VITE_BUILD_COMPRESS?.split(',').includes('gzip') &&
      compression({
        algorithms: ['gzip'],
      }),
    viteEnv.VITE_BUILD_COMPRESS?.split(',').includes('brotli') &&
      compression({
        exclude: [/\.(br)$/, /\.(gz)$/],
        algorithms: ['brotliCompress'],
      }),

    viteEnv.VITE_BUILD_ARCHIVE &&
      Archiver({
        archiveType: viteEnv.VITE_BUILD_ARCHIVE,
      }),

    AppLoading('loading.html'),

    // https://github.com/unplugin/unplugin-turbo-console
    TurboConsole(),

    // https://github.com/chengpeiquan/vite-plugin-banner
    banner(`

    `),

    {
      name: 'vite-plugin-debug-plugin',
      enforce: 'pre',
      transform: (code, id) => {
        if (/src\/main.ts$/.test(id)) {
          if (viteEnv.VITE_APP_DEBUG_TOOL === 'eruda') {
            code = code.concat(`
              import eruda from 'eruda'
              eruda.init()
            `)
          } else if (viteEnv.VITE_APP_DEBUG_TOOL === 'vconsole') {
            code = code.concat(`
              import VConsole from 'vconsole'
              new VConsole()
            `)
          }
          return {
            code,
            map: null,
          }
        }
      },
    },

    {
      name: 'vite-plugin-disable-devtool',
      enforce: 'pre',
      transform: (code, id) => {
        if (/src\/main.ts$/.test(id)) {
          if (viteEnv.VITE_APP_DISABLE_DEVTOOL) {
            // ?ddtk=example
            code = code.concat(`
              import DisableDevtool from 'disable-devtool'
              DisableDevtool({
                md5: '1a79a4d60de6718e8e5b326e338ae533',
              })
            `)
          }
          return {
            code,
            map: null,
          }
        }
      },
    },

    {
      name: 'vite-plugin-terminal-info',
      apply: 'serve',
      async buildStart() {
        const { bold, green, bgGreen } = picocolors
        // eslint-disable-next-line no-console
        console.log(
          boxen(
            // `${bold(green(`由 ${bgGreen('Fantastic-admin')} 驱动`))}\n\n${underline('https://fantastic-admin.hurui.me')}\n\n当前使用：${cyan('基础版')}`,
            `${bold(green(`================ ${bgGreen('Gaoge-admin')} ================`))}`,
            {
              padding: 1,
              margin: 1,
              borderStyle: 'double',
              textAlignment: 'center',
            },
          ),
        )
      },
    },
  ]
  return vitePlugins
}
