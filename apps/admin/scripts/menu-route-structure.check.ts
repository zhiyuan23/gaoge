import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import gaogeRoutes from '../src/router/modules/football/index'

const adminRoot = path.resolve(import.meta.dirname, '..')
const systemModulePath = path.join(adminRoot, 'src/router/modules/system/index.ts')
const playgroundModulePath = path.join(adminRoot, 'src/router/modules/playground/index.ts')
const routesFilePath = path.join(adminRoot, 'src/router/routes.ts')

assert(
  existsSync(playgroundModulePath),
  '缺少新的测试页面顶层菜单模块：src/router/modules/playground/index.ts',
)

assert(existsSync(systemModulePath), '缺少系统管理路由模块：src/router/modules/system/index.ts')

const gaogeChildren = gaogeRoutes.children ?? []

assert(!gaogeChildren.some((route) => route.path === '3d'), '3D 页面仍然挂在高歌体育菜单下')

assert(!gaogeChildren.some((route) => route.path === 'world'), '世界页面仍然挂在高歌体育菜单下')

const routesSource = readFileSync(routesFilePath, 'utf8')

assert(routesSource.includes("title: '测试'"), '顶层菜单里缺少“测试”分组')
assert(routesSource.includes('children: [Playground]'), '顶层菜单里没有挂载新的测试页面模块')

const systemModuleSource = readFileSync(systemModulePath, 'utf8')

assert(routesSource.includes("title: '系统管理'"), '顶层菜单里缺少“系统管理”分组')
assert(routesSource.includes('children: [System]'), '顶层菜单里没有挂载系统管理模块')
assert(systemModuleSource.includes("path: '/system'"), '系统管理模块缺少 /system 路径前缀')

console.log('menu route structure check passed')
