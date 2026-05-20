import type { RouteRecordRaw } from 'vue-router'

function Layout() {
  return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
  path: '/system',
  component: Layout,
  name: 'system',
  meta: {
    title: '用户权限',
    icon: 'ri:settings-3-line',
  },
  children: [
    {
      path: 'user',
      name: 'systemUser',
      component: () => import('@/views/system/user/index.vue'),
      meta: {
        title: '用户管理',
        auth: ['system.user.view'],
      },
    },
    {
      path: 'role',
      name: 'systemRole',
      component: () => import('@/views/system/role/index.vue'),
      meta: {
        title: '角色管理',
        auth: ['system.role.view'],
      },
    },
    {
      path: 'menu',
      name: 'systemMenu',
      component: () => import('@/views/system/menu/index.vue'),
      meta: {
        title: '菜单管理',
        auth: ['system.menu.view'],
      },
    },
    {
      path: 'permission',
      name: 'systemPermission',
      component: () => import('@/views/system/permission/index.vue'),
      meta: {
        title: '权限管理',
        auth: ['system.permission.view'],
      },
    },
  ],
}

export default routes
