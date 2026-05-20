import type { Plugin } from 'vue'
import VxeUI from 'vxe-pc-ui'
import VxeUITable from 'vxe-table'

// 加载 iconify 图标
import { downloadAndInstall } from '@/iconify'
import icons from '@/iconify/index.json'
// 自定义指令
import directive from '@/utils/directive'

import uiProvider from './ui/provider'
import App from './App.vue'
import router from './router'
import pinia from './store'

import 'vxe-table/lib/style.css'
import 'vxe-pc-ui/lib/style.css'
import 'virtual:uno.css'
import '@unocss/reset/tailwind-compat.css'
// 全局样式
import '@/assets/styles/globals.css'

import '@/utils/baidu'
import '@/utils/systemCopyright'
// 加载 svg 图标
import 'virtual:svg-icons-register'

const app = createApp(App)
app.use(VxeUI as unknown as Plugin).use(VxeUITable as unknown as Plugin)
app.use(pinia)
app.use(router)
app.use(uiProvider)
directive(app)
if (icons.isOfflineUse) {
  for (const info of icons.collections) {
    downloadAndInstall(info)
  }
}

// 全局错误处理，忽略接口请求未捕获的错误（拦截器已经处理过提示）
app.config.errorHandler = (err: any) => {
  // 忽略axios接口错误，已经在拦截器里弹过提示了
  if (err?.isAxiosError || err?.code !== undefined) {
    return
  }
  // 其他错误正常打印
  console.error('全局错误：', err)
}

// 全局捕获未处理的Promise错误，消除控制台警告
window.addEventListener('unhandledrejection', (e) => {
  // 忽略axios接口错误
  if (e.reason?.isAxiosError || e.reason?.code !== undefined) {
    e.preventDefault()
  }
})

app.mount('#app')
