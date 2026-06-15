export interface BuiltInRoleDefinition {
  code: string
  name: string
  description: string
  status: 'active' | 'inactive'
  sort: number
  isBuiltIn: true
}

export interface BuiltInPermissionDefinition {
  code: string
  name: string
  module: string
  resource: string
  action: string
  description: string
  status: 'active' | 'inactive'
  isBuiltIn: true
}

export interface BuiltInMenuDefinition {
  name: string
  title: string
  icon?: string
  path: string
  routeName: string
  menuType: 'catalog' | 'menu'
  sort: number
  status: 'active' | 'inactive'
  visible: boolean
  isBuiltIn: true
  permissionCodes: string[]
  children?: BuiltInMenuDefinition[]
}

export const BUILT_IN_ROLE_DEFINITIONS: BuiltInRoleDefinition[] = [
  {
    code: 'super_admin',
    name: '超级管理员',
    description: '拥有后台全部权限',
    status: 'active',
    sort: 0,
    isBuiltIn: true,
  },
  {
    code: 'system_viewer',
    name: '系统只读',
    description: '拥有后台只读权限',
    status: 'active',
    sort: 10,
    isBuiltIn: true,
  },
]

const moduleLabels: Record<string, string> = {
  football: '足球',
  basketball: '篮球',
  content: '内容',
  system: '系统',
}

const resourceLabels: Record<string, string> = {
  assetRecord: '资产记录',
  player: '球员',
  team: '球队',
  matchRound: '比赛轮次',
  fund: '资金',
  messageBoardPost: '留言板消息',
  banner: 'Banner',
  user: '用户',
  role: '角色',
  permission: '权限',
  menu: '菜单',
  'wechat-share': '微信分享配置',
}

const actionLabels: Record<string, string> = {
  view: '查看',
  create: '新增',
  update: '编辑',
  enable: '启用',
  disable: '停用',
  'reset-password': '重置密码',
  delete: '删除',
  'assign-permission': '分配权限',
  'sync-builtins': '同步内置权限',
  sort: '调整排序',
}

const permissionCodes = [
  'football.assetRecord.view',
  'football.assetRecord.create',
  'football.assetRecord.update',
  'football.assetRecord.delete',
  'football.player.view',
  'football.player.create',
  'football.player.update',
  'football.player.delete',
  'football.team.view',
  'football.team.create',
  'football.team.update',
  'football.team.delete',
  'football.matchRound.view',
  'football.matchRound.create',
  'football.matchRound.update',
  'football.matchRound.delete',
  'football.fund.view',
  'football.fund.create',
  'football.fund.update',
  'football.fund.delete',
  'basketball.assetRecord.view',
  'basketball.assetRecord.create',
  'basketball.assetRecord.update',
  'basketball.assetRecord.delete',
  'basketball.player.view',
  'basketball.player.create',
  'basketball.player.update',
  'basketball.player.delete',
  'basketball.team.view',
  'basketball.team.create',
  'basketball.team.update',
  'basketball.team.delete',
  'basketball.matchRound.view',
  'basketball.matchRound.create',
  'basketball.matchRound.update',
  'basketball.matchRound.delete',
  'basketball.fund.view',
  'basketball.fund.create',
  'basketball.fund.update',
  'basketball.fund.delete',
  'content.messageBoardPost.view',
  'content.messageBoardPost.create',
  'content.messageBoardPost.update',
  'content.messageBoardPost.delete',
  'content.messageBoardPost.publish',
  'content.banner.view',
  'content.banner.create',
  'content.banner.update',
  'content.banner.delete',
  'system.user.view',
  'system.user.create',
  'system.user.update',
  'system.user.enable',
  'system.user.disable',
  'system.user.reset-password',
  'system.user.delete',
  'system.role.view',
  'system.role.create',
  'system.role.update',
  'system.role.enable',
  'system.role.disable',
  'system.role.delete',
  'system.role.assign-permission',
  'system.permission.view',
  'system.permission.create',
  'system.permission.update',
  'system.permission.delete',
  'system.permission.sync-builtins',
  'system.menu.view',
  'system.menu.create',
  'system.menu.update',
  'system.menu.delete',
  'system.menu.sort',
  'system.menu.assign-permission',
  'system.wechat-share.view',
  'system.wechat-share.update',
] as const

export const BUILT_IN_PERMISSION_DEFINITIONS: BuiltInPermissionDefinition[] = permissionCodes.map(
  (code) => {
    const [module, resource, action] = code.split('.')
    return {
      code,
      name: buildPermissionName(module, resource, action),
      module,
      resource,
      action,
      description: `${module}.${resource}.${action}`,
      status: 'active',
      isBuiltIn: true,
    }
  },
)

export const SUPER_ADMIN_PERMISSION_CODES = BUILT_IN_PERMISSION_DEFINITIONS.map((item) => item.code)

export const SYSTEM_VIEWER_PERMISSION_CODES = BUILT_IN_PERMISSION_DEFINITIONS.map(
  (item) => item.code,
).filter((code) => code.endsWith('.view'))

export const BUILT_IN_MENU_DEFINITIONS: BuiltInMenuDefinition[] = [
  {
    name: 'system',
    title: '用户权限',
    icon: 'ri:settings-3-line',
    path: '/system',
    routeName: 'system',
    menuType: 'catalog',
    sort: 0,
    status: 'active',
    visible: true,
    isBuiltIn: true,
    permissionCodes: [],
    children: [
      {
        name: 'systemUser',
        title: '用户管理',
        path: '/system/user',
        routeName: 'systemUser',
        menuType: 'menu',
        sort: 0,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        permissionCodes: ['system.user.view'],
      },
      {
        name: 'systemRole',
        title: '角色管理',
        path: '/system/role',
        routeName: 'systemRole',
        menuType: 'menu',
        sort: 10,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        permissionCodes: ['system.role.view'],
      },
      {
        name: 'systemMenu',
        title: '菜单管理',
        path: '/system/menu',
        routeName: 'systemMenu',
        menuType: 'menu',
        sort: 20,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        permissionCodes: ['system.menu.view'],
      },
      {
        name: 'systemPermission',
        title: '权限管理',
        path: '/system/permission',
        routeName: 'systemPermission',
        menuType: 'menu',
        sort: 30,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        permissionCodes: ['system.permission.view'],
      },
    ],
  },
  {
    name: 'content',
    title: '内容管理',
    icon: 'ri:article-line',
    path: '/content',
    routeName: 'content',
    menuType: 'catalog',
    sort: 15,
    status: 'active',
    visible: true,
    isBuiltIn: true,
    permissionCodes: [],
    children: [
      {
        name: 'contentMessageBoardPost',
        title: '留言板',
        path: '/content/message-board-post',
        routeName: 'contentMessageBoardPost',
        menuType: 'menu',
        sort: 0,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        permissionCodes: ['content.messageBoardPost.view'],
      },
      {
        name: 'contentBanner',
        title: 'Banner 管理',
        path: '/content/banner',
        routeName: 'contentBanner',
        menuType: 'menu',
        sort: 10,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        permissionCodes: ['content.banner.view'],
      },
    ],
  },
  {
    name: 'wechat',
    title: '微信管理',
    icon: 'ri:wechat-2-line',
    path: '/wechat',
    routeName: 'wechat',
    menuType: 'catalog',
    sort: 10,
    status: 'active',
    visible: true,
    isBuiltIn: true,
    permissionCodes: [],
    children: [
      {
        name: 'wechatShare',
        title: '微信分享配置',
        path: '/wechat/share',
        routeName: 'wechatShare',
        menuType: 'menu',
        sort: 0,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        permissionCodes: ['system.wechat-share.view'],
      },
    ],
  },
]

export const LEGACY_ROLE_CODE_MAP: Record<string, string> = {
  admin: 'super_admin',
  viewer: 'system_viewer',
}

function buildPermissionName(module: string, resource: string, action: string) {
  const moduleLabel = moduleLabels[module] ?? module
  const resourceLabel = resourceLabels[resource] ?? resource
  const actionLabel = actionLabels[action] ?? action

  if (action === 'sync-builtins') {
    return `同步${moduleLabel}内置${resourceLabel}`
  }

  if (action === 'assign-permission') {
    return `分配${moduleLabel}${resourceLabel}权限`
  }

  if (action === 'sort') {
    return `调整${moduleLabel}${resourceLabel}排序`
  }

  return `${actionLabel}${moduleLabel}${resourceLabel}`
}
