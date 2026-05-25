import type { RouteRecordRaw } from 'vue-router'

import WechatShare from '../system/wechat-share'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/wechat',
  component: Layout,
  name: 'wechat',
  meta: {
    title: '微信管理',
    icon: 'ri:wechat-2-line',
  },
  children: [WechatShare],
}

export default routes
