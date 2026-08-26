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

  const builtInGroup = {
    id: 30,
    parentId: null,
    name: 'sports',
    title: '高歌体育',
    icon: null,
    path: null,
    routeName: 'sports',
    menuType: 'group',
    sort: 0,
    status: 'active',
    visible: true,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
    menuResources: [],
    menuPermissions: [],
  }

  const builtInGroupPayload = {
    parentId: null,
    name: 'sports',
    title: '高歌体育',
    path: null,
    routeName: 'sports',
    menuType: 'group' as const,
    sort: 0,
    status: 'active' as const,
    visible: true,
    resourceIds: [],
    expectedUpdatedAt: now.toISOString(),
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

  it.each([
    ['name', 'renamedSports'],
    ['routeName', 'renamedSports'],
    ['path', '/renamed-sports'],
    ['menuType', 'catalog'],
    ['parentId', 99],
    ['isBuiltIn', false],
  ] as const)('rejects changing built-in structural field %s', async (field, value) => {
    const { prisma, service } = createService()
    prisma.menu.findUnique.mockResolvedValue(builtInGroup)

    await expect(
      service.update(30, { ...builtInGroupPayload, [field]: value } as any, 1),
    ).rejects.toThrow('内置菜单的结构和资源关联由系统配置维护')
    expect(prisma.menu.update).not.toHaveBeenCalled()
  })

  it('allows built-in presentation changes while accepting unchanged echoed structure', async () => {
    const { prisma, service } = createService()
    const updated = {
      ...builtInGroup,
      title: '定制体育',
      icon: 'custom:sports',
      sort: 25,
      status: 'inactive',
      visible: false,
    }
    prisma.menu.findUnique.mockResolvedValueOnce(builtInGroup).mockResolvedValueOnce(updated)
    prisma.menu.update.mockResolvedValue(updated)

    const result = await service.update(
      30,
      {
        ...builtInGroupPayload,
        title: '定制体育',
        icon: 'custom:sports',
        sort: 25,
        status: 'inactive',
        visible: false,
        isBuiltIn: true,
      } as any,
      1,
    )

    expect(prisma.menu.update).toHaveBeenCalledWith({
      where: { id: 30 },
      data: {
        title: '定制体育',
        icon: 'custom:sports',
        sort: 25,
        status: 'inactive',
        visible: false,
      },
    })
    expect(prisma.menuResource.deleteMany).not.toHaveBeenCalled()
    expect(result.title).toBe('定制体育')
  })

  it('allows an administrator to clear a built-in presentation icon', async () => {
    const { prisma, service } = createService()
    const current = { ...builtInGroup, icon: 'custom:sports' }
    const updated = { ...current, icon: null }
    prisma.menu.findUnique.mockResolvedValueOnce(current).mockResolvedValueOnce(updated)
    prisma.menu.update.mockResolvedValue(updated)

    await service.update(30, { ...builtInGroupPayload, icon: '' }, 1)

    expect(prisma.menu.update).toHaveBeenCalledWith({
      where: { id: 30 },
      data: expect.objectContaining({ icon: null }),
    })
  })

  it('rejects replacing built-in Resource associations', async () => {
    const { prisma, service } = createService()
    const builtInPage = {
      ...builtInGroup,
      id: 31,
      name: 'player',
      title: '球员信息',
      path: '/sports/football/player',
      routeName: 'player',
      menuType: 'menu',
      menuResources: [
        {
          resourceId: 7,
          resource: {
            id: 7,
            key: 'football.player',
            name: '球员',
            module: 'football',
            status: 'active',
          },
        },
      ],
    }
    prisma.menu.findUnique.mockResolvedValue(builtInPage)

    await expect(
      service.updateResources(31, { resourceIds: [8], expectedUpdatedAt: now.toISOString() }, 1),
    ).rejects.toThrow('内置菜单的结构和资源关联由系统配置维护')
    expect(prisma.menuResource.deleteMany).not.toHaveBeenCalled()
  })

  it('accepts unchanged echoed Resource associations on a built-in page', async () => {
    const { prisma, service } = createService()
    const builtInPage = {
      ...builtInGroup,
      id: 31,
      name: 'player',
      title: '球员信息',
      path: '/sports/football/player',
      routeName: 'player',
      menuType: 'menu',
      menuResources: [
        {
          resourceId: 7,
          resource: {
            id: 7,
            key: 'football.player',
            name: '球员',
            module: 'football',
            status: 'active',
          },
        },
      ],
    }
    prisma.menu.findUnique.mockResolvedValue(builtInPage)

    const result = await service.updateResources(
      31,
      { resourceIds: [7], expectedUpdatedAt: now.toISOString() },
      1,
    )

    expect(prisma.menuResource.deleteMany).not.toHaveBeenCalled()
    expect(prisma.menu.update).not.toHaveBeenCalled()
    expect(result.resources).toEqual([
      { id: 7, key: 'football.player', name: '球员', module: 'football', status: 'active' },
    ])
  })

  it('rejects creating a client-declared built-in menu', async () => {
    const { prisma, service } = createService()

    await expect(service.create({ ...payload, isBuiltIn: true } as any, 1)).rejects.toThrow(
      '内置菜单只能由系统配置创建',
    )
    expect(prisma.menu.create).not.toHaveBeenCalled()
  })

  it('retains structural and Resource editing for custom menus', async () => {
    const { prisma, service } = createService()
    const current = {
      id: 40,
      ...payload,
      icon: null,
      sort: 0,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
      menuResources: [],
      menuPermissions: [],
    }
    const updated = {
      ...current,
      name: 'renamedReport',
      path: '/renamed-report',
      updatedAt: new Date('2026-08-26T00:01:00.000Z'),
    }
    prisma.menu.findUnique.mockResolvedValueOnce(current).mockResolvedValueOnce(updated)
    prisma.menu.update.mockResolvedValue(updated)
    prisma.resource.findMany.mockResolvedValue([{ id: 8, permissions: [{ id: 80 }] }])

    await service.update(
      40,
      {
        ...payload,
        name: 'renamedReport',
        path: '/renamed-report',
        resourceIds: [8],
        expectedUpdatedAt: now.toISOString(),
      },
      1,
    )

    expect(prisma.menu.update).toHaveBeenCalledWith({
      where: { id: 40 },
      data: expect.objectContaining({ name: 'renamedReport', path: '/renamed-report' }),
    })
    expect(prisma.menuResource.createMany).toHaveBeenCalledWith({
      data: [{ menuId: 40, resourceId: 8, sort: 0 }],
      skipDuplicates: true,
    })
  })
})
