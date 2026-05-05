import { loadingFadeOut } from 'virtual:app-loading'
import { createRouter, createWebHistory } from 'vue-router'

import setupGuards from './guards'
// 路由相关数据
import { constantRoutes } from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})

setupGuards(router)

router.isReady().then(() => {
  loadingFadeOut()
})

export default router
