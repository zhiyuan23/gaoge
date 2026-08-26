import { BadRequestException } from '@nestjs/common'

import { SystemMenuConfigurationService } from './system-menu-configuration.service'

jest.mock('@gaoge/shared-types', () => ({
  ADMIN_PAGE_ROUTE_NAMES: [
    'player',
    'team',
    'matchRound',
    'assetRecord',
    'contentBanner',
    'contentRumorPost',
    'systemUser',
    'systemRole',
    'systemMenu',
    'systemAudit',
    'wechatShare',
  ],
}))

describe('SystemMenuConfigurationService', () => {
  const now = new Date('2026-08-26T00:00:00.000Z')

  const createService = () => {
    const prisma = {
      menu: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      resource: { findMany: jest.fn().mockResolvedValue([]) },
      menuResource: { deleteMany: jest.fn(), createMany: jest.fn() },
      menuPermission: { deleteMany: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prisma)),
    }
    const audit = { record: jest.fn().mockResolvedValue(undefined) }
    return {
      prisma,
      service: new SystemMenuConfigurationService(prisma as any, audit as any),
    }
  }

  const payload = {
    parentId: null,
    name: 'report',
    title: '报表',
    path: '/report',
    routeName: 'systemMenu',
    menuType: 'menu' as const,
    status: 'active' as const,
    visible: true,
    resourceIds: [7],
  }

  it('dual-writes MenuResource and legacy MenuPermission from resource view permissions', async () => {
    const { prisma, service } = createService()
    const menu = {
      id: 3,
      ...payload,
      icon: null,
      sort: 0,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
      menuResources: [],
      menuPermissions: [],
    }
    prisma.menu.create.mockResolvedValue(menu)
    prisma.resource.findMany.mockResolvedValue([{ id: 7, permissions: [{ id: 70 }] }])
    prisma.menu.findUnique.mockResolvedValue(menu)

    await service.create(payload, 1)

    expect(prisma.menuResource.createMany).toHaveBeenCalledWith({
      data: [{ menuId: 3, resourceId: 7, sort: 0 }],
      skipDuplicates: true,
    })
    expect(prisma.menuPermission.createMany).toHaveBeenCalledWith({
      data: [{ menuId: 3, permissionId: 70 }],
      skipDuplicates: true,
    })
  })

  it('rejects resource relationships on navigation groups', async () => {
    const { prisma, service } = createService()
    prisma.menu.create.mockResolvedValue({ id: 3, menuType: 'group' })

    await expect(
      service.create({ ...payload, menuType: 'group' as const, path: null }, 1),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.menuResource.createMany).not.toHaveBeenCalled()
  })

  it('accepts a pathless navigation group', async () => {
    const { prisma, service } = createService()
    const group = {
      id: 3,
      parentId: null,
      name: 'systemManagement',
      title: '系统管理',
      path: null,
      routeName: 'systemManagement',
      menuType: 'group',
      sort: 10,
      status: 'active',
      visible: true,
      icon: null,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
      menuResources: [],
      menuPermissions: [],
    }
    prisma.menu.create.mockResolvedValue(group)
    prisma.menu.findUnique.mockResolvedValue(group)

    await service.create({
      parentId: null,
      name: 'systemManagement',
      title: '系统管理',
      path: null,
      routeName: 'systemManagement',
      menuType: 'group',
      sort: 10,
      status: 'active',
      visible: true,
      resourceIds: [],
    })

    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it.each(['catalog', 'menu'] as const)('rejects an empty path for %s', async (menuType) => {
    const { service } = createService()

    await expect(
      service.create({
        parentId: null,
        name: 'invalid',
        title: '无效菜单',
        path: null,
        routeName: 'player',
        menuType,
        status: 'active',
        visible: true,
        resourceIds: [],
      }),
    ).rejects.toThrow('只有导航分组允许空路径')
  })

  it('rejects a page routeName outside the compiled Admin registry', async () => {
    const { service } = createService()

    await expect(
      service.create({
        parentId: 1,
        name: 'unknownPage',
        title: '未知页面',
        path: '/unknown',
        routeName: 'unknownPage',
        menuType: 'menu',
        status: 'active',
        visible: true,
        resourceIds: [],
      }),
    ).rejects.toThrow('页面路由未在当前 Admin 版本注册')
  })

  it('rejects using a page menu as a parent', async () => {
    const { prisma, service } = createService()
    prisma.menu.findUnique.mockResolvedValue({ id: 9, menuType: 'menu' })

    await expect(service.create({ ...payload, parentId: 9 }, 1)).rejects.toThrow(
      '父级必须是导航分组或目录菜单',
    )
    expect(prisma.menu.create).not.toHaveBeenCalled()
  })
})
