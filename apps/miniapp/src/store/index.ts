import { createPinia } from 'pinia'
// 数据持久化
import { createPersistedState } from 'pinia-plugin-persistedstate'
import type { App } from 'vue'

// 导入子模块
import useAppStore from './app'
import useAuthStore from './auth'

// 安装pinia状态管理插件
const setupStore = (app: App) => {
  const store = createPinia()

  const piniaPersist = createPersistedState({
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  })
  store.use(piniaPersist)

  app.use(store)
}

// 导出模块
export { useAppStore, useAuthStore }

export default setupStore
