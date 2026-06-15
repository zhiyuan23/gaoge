import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import basketballRoutes from '../src/router/modules/basketball/index'
import sportsRoutes from '../src/router/modules/sports'

const adminRoot = path.resolve(import.meta.dirname, '..')
const basketballModulePath = path.join(adminRoot, 'src/router/modules/basketball/index.ts')
const sportsModulePath = path.join(adminRoot, 'src/router/modules/sports/index.ts')
const systemModulePath = path.join(adminRoot, 'src/router/modules/system/index.ts')
const playgroundModulePath = path.join(adminRoot, 'src/router/modules/playground/index.ts')
const routesFilePath = path.join(adminRoot, 'src/router/routes.ts')

assert(
  existsSync(playgroundModulePath),
  '缺少新的测试页面顶层菜单模块：src/router/modules/playground/index.ts',
)

assert(
  existsSync(basketballModulePath),
  '缺少新的高歌篮球俱乐部菜单模块：src/router/modules/basketball/index.ts',
)

assert(existsSync(sportsModulePath), '缺少高歌体育聚合路由模块：src/router/modules/sports/index.ts')
assert(existsSync(systemModulePath), '缺少系统管理路由模块：src/router/modules/system/index.ts')

const sportsChildren = sportsRoutes.children ?? []
const footballRoutes = sportsChildren.find((route) => route.meta?.title === '高歌FC')
const contentRoutes = sportsChildren.find((route) => route.meta?.title === '内容管理')
const footballChildren = footballRoutes?.children ?? []

assert(!footballChildren.some((route) => route.path === '3d'), '3D 页面仍然挂在高歌体育菜单下')

assert(!footballChildren.some((route) => route.path === 'world'), '世界页面仍然挂在高歌体育菜单下')

assert(sportsRoutes.meta?.title === '高歌体育', '高歌体育菜单标题异常')
assert(!('path' in sportsRoutes), '高歌体育主菜单不应直接承载真实路由 path')
assert(footballRoutes?.path === '/sports/football', '高歌FC 路由缺少 /sports/football 路径前缀')
assert(footballRoutes?.meta?.title === '高歌FC', '高歌FC 菜单标题异常')
assert(contentRoutes?.path === '/sports/content', '内容管理路由缺少 /sports/content 路径前缀')
assert(contentRoutes?.meta?.title === '内容管理', '内容管理菜单标题异常')
assert(basketballRoutes.path === '/basketball', '高歌篮球俱乐部路由缺少 /basketball 路径前缀')
assert(basketballRoutes.meta?.title === '高歌篮球俱乐部', '高歌篮球俱乐部菜单标题异常')

const routesSource = readFileSync(routesFilePath, 'utf8')

assert(
  routesSource.includes("import Basketball from './modules/basketball'"),
  '顶层路由缺少篮球菜单模块导入',
)
assert(
  routesSource.includes("import Sports from './modules/sports'"),
  '顶层路由缺少高歌体育聚合菜单模块导入',
)
assert(
  routesSource.includes('children: [Basketball]') ||
    routesSource.includes('children: [Basketball],'),
  '篮球菜单没有通过主菜单壳挂载',
)
assert(routesSource.includes('Sports,'), '顶层路由里没有挂载高歌体育聚合菜单模块')
assert(routesSource.includes("title: '测试'"), '顶层菜单里缺少“测试”分组')
assert(routesSource.includes('children: [Playground]'), '顶层菜单里没有挂载新的测试页面模块')

const systemModuleSource = readFileSync(systemModulePath, 'utf8')

assert(routesSource.includes("title: '系统管理'"), '顶层菜单里缺少“系统管理”分组')
assert(routesSource.includes('children: [System, Wechat]'), '顶层菜单里没有完整挂载系统管理模块')
assert(systemModuleSource.includes("path: '/system'"), '系统管理模块缺少 /system 路径前缀')

console.log('menu route structure check passed')
