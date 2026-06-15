import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'virtual:meta-layouts'
import type { RouteRecordRaw } from 'vue-router'

import useSettingsStore from '@/store/settings'

import BreadcrumbExample from './modules/example/breadcrumb'
import ComponentExample from './modules/example/component'
import ExternalLinkExample from './modules/example/external-link'
import FeatureExample from './modules/example/feature'
import IconExample from './modules/example/icon'
import JsxExample from './modules/example/jsx'
import KeepAliveExample from './modules/example/keep-alive'
import MockExample from './modules/example/mock'
import MultilevelMenuExample from './modules/example/multilevel-menu'
import PermissionExample from './modules/example/permission'
import PluginExample from './modules/example/plugin'
import TabExample from './modules/example/tab'
import Playground from './modules/playground'
import Sports from './modules/sports'
import System from './modules/system'
import Wechat from './modules/wechat'

import type { Route } from '#/global'

// 固定路由（默认路由）
const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    meta: {
      title: '首页',
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login.vue'),
    meta: {
      title: '登录',
    },
  },
  {
    path: '/:all(.*)*',
    name: 'notFound',
    component: () => import('@/views/[...all].vue'),
    meta: {
      title: '找不到页面',
    },
  },
]

// 系统路由
const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'home',
    component: () => import('@/layouts/index.vue'),
    meta: {
      title: () => useSettingsStore().settings.home.title,
      breadcrumb: false,
    },
    children: [
      {
        path: '',
        component: () => import('@/views/index.vue'),
        meta: {
          title: () => useSettingsStore().settings.home.title,
          icon: 'i-ant-design:home-twotone',
          breadcrumb: false,
        },
      },
      {
        path: 'reload',
        name: 'reload',
        component: () => import('@/views/reload.vue'),
        meta: {
          title: '重新加载',
          breadcrumb: false,
        },
      },
    ],
  },
]

// 动态路由（异步路由、导航栏路由）
const asyncRoutes: Route.recordMainRaw[] = [
  Sports,
  {
    meta: {
      title: '演示',
      icon: 'i-uim:box',
    },
    children: [
      MultilevelMenuExample,
      BreadcrumbExample,
      KeepAliveExample,
      TabExample,
      ComponentExample,
      IconExample,
      FeatureExample,
      PluginExample,
      PermissionExample,
      MockExample,
      JsxExample,
      ExternalLinkExample,
    ],
  },
  {
    meta: {
      title: '测试',
      icon: 'lucide:flask-conical',
    },
    children: [Playground],
  },
  {
    meta: {
      title: '系统管理',
      icon: 'ri:settings-3-line',
    },
    children: [System, Wechat],
  },
]

const constantRoutesByFilesystem = generatedRoutes.filter((item) => {
  return item.meta?.enabled !== false && item.meta?.constant === true
})

const asyncRoutesByFilesystem = setupLayouts(
  generatedRoutes.filter((item) => {
    return (
      item.meta?.enabled !== false && item.meta?.constant !== true && item.meta?.layout !== false
    )
  }),
)

export {
  asyncRoutes,
  asyncRoutesByFilesystem,
  constantRoutes,
  constantRoutesByFilesystem,
  systemRoutes,
}
