import type { RouteRecordRaw } from 'vue-router'

export const fixedHiddenRoutes: RouteRecordRaw[] = [
  {
    path: '/system/permission',
    name: 'systemPermission',
    redirect: { name: 'systemMenu', query: { view: 'resources' } },
    meta: {
      auth: ['system.permission.view'],
      menu: false,
      breadcrumb: false,
    },
  },
]
