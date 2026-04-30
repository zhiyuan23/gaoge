import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import gaogeRoutes from '../src/router/modules/gaoge/index'

const adminRoot = path.resolve(import.meta.dirname, '..')
const playgroundModulePath = path.join(adminRoot, 'src/router/modules/playground/index.ts')
const routesFilePath = path.join(adminRoot, 'src/router/routes.ts')

assert(
  existsSync(playgroundModulePath),
  '缺少新的测试页面顶层菜单模块：src/router/modules/playground/index.ts',
)

const gaogeChildren = gaogeRoutes.children ?? []

assert(!gaogeChildren.some((route) => route.path === '3d'), '3D 页面仍然挂在高歌体育菜单下')

assert(!gaogeChildren.some((route) => route.path === 'world'), '世界页面仍然挂在高歌体育菜单下')

const routesSource = readFileSync(routesFilePath, 'utf8')

assert(routesSource.includes("title: '测试'"), '顶层菜单里缺少“测试”分组')
assert(routesSource.includes('children: [Playground]'), '顶层菜单里没有挂载新的测试页面模块')

console.log('menu route structure check passed')
