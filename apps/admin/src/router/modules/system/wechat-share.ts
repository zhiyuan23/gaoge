import type { RouteRecordRaw } from 'vue-router'

import { SYSTEM_WECHAT_SHARE_PERMISSIONS } from '@/views/system/wechat-share/auth'

const route: RouteRecordRaw = {
  path: 'share',
  name: 'wechatShare',
  component: () => import('@/views/system/wechat-share/index.vue'),
  meta: {
    title: '微信分享配置',
    auth: [SYSTEM_WECHAT_SHARE_PERMISSIONS.view],
  },
}

export default route
