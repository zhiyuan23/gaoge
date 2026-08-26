import { RbacSyncService } from './rbac-sync.service'

describe('RbacSyncService', () => {
  const createService = () => {
    const prisma = {
      role: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      permission: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
      },
      resource: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      menu: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
      },
      rolePermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      menuPermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      menuResource: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findFirst: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      userRole: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prisma)),
    }

    prisma.role.findMany.mockResolvedValue([])
    prisma.permission.findMany.mockResolvedValue([])
    prisma.permission.findFirst.mockResolvedValue(null)
    prisma.resource.findMany.mockResolvedValue([])
    prisma.menu.findMany.mockResolvedValue([])
    prisma.menu.findFirst.mockResolvedValue(null)
    prisma.menuResource.findFirst.mockResolvedValue(null)

    return {
      prisma,
      service: new RbacSyncService(prisma as any),
    }
  }

  const prepareSuccessfulSync = (prisma: ReturnType<typeof createService>['prisma']) => {
    let resourceId = 100
    let menuId = 1000
    prisma.role.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.code === 'super_admin' ? 1 : 2,
      ...update,
      ...create,
    }))
    prisma.permission.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.code.length,
      ...update,
      ...create,
    }))
    prisma.resource.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: resourceId++,
      ...update,
      ...create,
    }))
    prisma.menu.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: menuId++,
      ...update,
      ...create,
    }))
    prisma.user.findMany.mockResolvedValue([])
  }

  it('upserts built-in roles, permissions, menus, and relationships idempotently', async () => {
    const { service, prisma } = createService()

    prisma.role.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.code === 'super_admin' ? 1 : 2,
      ...update,
      ...create,
    }))
    prisma.permission.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.code.length,
      ...update,
      ...create,
    }))
    prisma.resource.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.key.length,
      ...update,
      ...create,
    }))
    prisma.menu.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.routeName === 'system' ? 10 : create.routeName.length,
      ...update,
      ...create,
    }))
    prisma.user.findMany.mockResolvedValue([
      { id: 8, role: 'admin', account: 'admin', userRoles: [] },
      { id: 9, role: 'viewer', account: 'viewer', userRoles: [] },
      { id: 10, role: 'user', account: null, userRoles: [] },
    ])

    const result = await service.syncBuiltIns()

    expect(prisma.role.upsert).toHaveBeenCalled()
    expect(prisma.permission.upsert).toHaveBeenCalled()
    expect(prisma.resource.upsert).toHaveBeenCalled()
    expect(prisma.menu.upsert).toHaveBeenCalled()
    expect(prisma.menu.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { routeName: 'team' },
        update: expect.objectContaining({
          parentId: expect.any(Number),
          path: '/sports/football/team',
        }),
        create: expect.objectContaining({
          path: '/sports/football/team',
          routeName: 'team',
        }),
      }),
    )
    expect(prisma.menu.updateMany).toHaveBeenCalledWith({
      where: { routeName: { in: ['systemPermission'] }, isBuiltIn: true },
      data: { status: 'inactive', visible: false },
    })
    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
      where: {
        roleId: { in: [1, 2] },
        permissionId: { in: expect.any(Array) },
      },
    })
    expect(prisma.rolePermission.createMany).toHaveBeenCalled()
    expect(prisma.menuPermission.deleteMany).toHaveBeenCalled()
    expect(prisma.menuPermission.createMany).toHaveBeenCalled()
    expect(prisma.menuResource.createMany).toHaveBeenCalled()
    expect(prisma.userRole.upsert).toHaveBeenCalledTimes(2)
    expect(result.roles).toBeGreaterThanOrEqual(2)
    expect(result.permissions).toBeGreaterThan(0)
    expect(result.resources).toBeGreaterThan(0)
    expect(result.menus).toBeGreaterThanOrEqual(5)
  })

  it('does not augment API-managed user roles from the legacy role column', async () => {
    const { service, prisma } = createService()
    prepareSuccessfulSync(prisma)
    prisma.user.findMany.mockResolvedValue([
      {
        id: 8,
        role: 'admin',
        account: 'restricted',
        userRoles: [{ roleId: 3 }],
      },
      {
        id: 9,
        role: 'admin',
        account: 'legacy-admin',
        userRoles: [],
      },
    ])

    await service.syncBuiltIns()

    expect(prisma.userRole.upsert).toHaveBeenCalledTimes(1)
    expect(prisma.userRole.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_roleId: { userId: 9, roleId: 1 } },
      }),
    )
  })

  it('upserts built-in permissions with localized Chinese names', async () => {
    const { service, prisma } = createService()

    prisma.role.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.code === 'super_admin' ? 1 : 2,
      ...update,
      ...create,
    }))
    prisma.permission.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.code.length,
      ...update,
      ...create,
    }))
    prisma.resource.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.key.length,
      ...update,
      ...create,
    }))
    prisma.menu.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.routeName === 'system' ? 10 : create.routeName.length,
      ...update,
      ...create,
    }))
    prisma.user.findMany.mockResolvedValue([])

    await service.syncBuiltIns()

    expect(prisma.resource.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'content.rumorPost' },
        update: expect.objectContaining({ description: '' }),
        create: expect.objectContaining({ description: '' }),
      }),
    )
    expect(prisma.permission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 'system.permission.sync-builtins' },
        update: expect.objectContaining({
          name: '同步系统内置权限',
        }),
        create: expect.objectContaining({
          name: '同步系统内置权限',
        }),
      }),
    )
    expect(prisma.permission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: 'football.player.view' },
        update: expect.objectContaining({
          name: '查看足球球员',
        }),
      }),
    )
  })

  it('syncs the exact server-owned navigation topology and resource bindings', async () => {
    const { service, prisma } = createService()
    prepareSuccessfulSync(prisma)

    await service.syncBuiltIns()

    const menuUpserts = prisma.menu.upsert.mock.calls.map(([argument]) => argument)
    const expectedMenus = [
      ['sports', 1000, null, 'sports', 'group', null, 0],
      ['sportsFootball', 1001, 1000, 'football', 'catalog', '/sports/football', 0],
      ['player', 1002, 1001, 'player', 'menu', '/sports/football/player', 0],
      ['team', 1003, 1001, 'team', 'menu', '/sports/football/team', 10],
      ['matchRound', 1004, 1001, 'matchRound', 'menu', '/sports/football/match-round', 20],
      ['assetRecord', 1005, 1001, 'assetRecord', 'menu', '/sports/football/asset-record', 30],
      ['sportsContent', 1006, 1000, 'content', 'catalog', '/sports/content', 10],
      ['contentBanner', 1007, 1006, 'contentBanner', 'menu', '/sports/content/banner', 0],
      [
        'contentRumorPost',
        1008,
        1006,
        'contentRumorPost',
        'menu',
        '/sports/content/rumor-post',
        10,
      ],
      ['systemManagement', 1009, null, 'systemManagement', 'group', null, 10],
      ['system', 1010, 1009, 'system', 'catalog', '/system', 0],
      ['systemUser', 1011, 1010, 'systemUser', 'menu', '/system/user', 0],
      ['systemRole', 1012, 1010, 'systemRole', 'menu', '/system/role', 10],
      ['systemMenu', 1013, 1010, 'systemMenu', 'menu', '/system/menu', 20],
      ['systemAudit', 1014, 1010, 'systemAudit', 'menu', '/system/audit', 30],
      ['wechat', 1015, 1009, 'wechat', 'catalog', '/wechat', 10],
      ['wechatShare', 1016, 1015, 'wechatShare', 'menu', '/wechat/share', 0],
    ] as const

    expect(menuUpserts.map(({ create }) => create.routeName)).toEqual(
      expectedMenus.map(([routeName]) => routeName),
    )
    expect(
      menuUpserts.map(({ create }) => [
        create.routeName,
        create.parentId,
        create.name,
        create.menuType,
        create.path,
        create.sort,
      ]),
    ).toEqual(
      expectedMenus.map(([routeName, , parentId, name, menuType, path, sort]) => [
        routeName,
        parentId,
        name,
        menuType,
        path,
        sort,
      ]),
    )
    expect(menuUpserts.map(({ update }) => update)).toEqual(
      expectedMenus.map(([, , parentId, name, menuType, path]) => ({
        parentId,
        name,
        path,
        menuType,
        isBuiltIn: true,
      })),
    )
    expect(menuUpserts.every(({ update }) => !('title' in update))).toBe(true)
    expect(menuUpserts.every(({ update }) => !('icon' in update))).toBe(true)
    expect(menuUpserts.every(({ update }) => !('sort' in update))).toBe(true)
    expect(menuUpserts.every(({ update }) => !('status' in update))).toBe(true)
    expect(menuUpserts.every(({ update }) => !('visible' in update))).toBe(true)
    expect(prisma.menuResource.createMany).toHaveBeenCalledWith({
      data: [
        { menuId: 1002, resourceId: 101, sort: 0 },
        { menuId: 1003, resourceId: 102, sort: 0 },
        { menuId: 1004, resourceId: 103, sort: 0 },
        { menuId: 1005, resourceId: 100, sort: 0 },
        { menuId: 1007, resourceId: 106, sort: 0 },
        { menuId: 1008, resourceId: 105, sort: 0 },
        { menuId: 1011, resourceId: 107, sort: 0 },
        { menuId: 1012, resourceId: 108, sort: 0 },
        { menuId: 1013, resourceId: 110, sort: 0 },
        { menuId: 1013, resourceId: 109, sort: 1 },
        { menuId: 1014, resourceId: 111, sort: 0 },
        { menuId: 1016, resourceId: 112, sort: 0 },
      ],
      skipDuplicates: true,
    })
  })

  it('deletes stale built-ins and removes menu descendants before their parents', async () => {
    const { service, prisma } = createService()
    prepareSuccessfulSync(prisma)
    prisma.role.findMany.mockResolvedValue([{ id: 601, code: 'system_admin' }])
    prisma.resource.findMany.mockResolvedValue([{ id: 701, key: 'product.product' }])
    prisma.permission.findMany.mockResolvedValue([
      { id: 801, code: 'product.product.view', resourceId: 701 },
    ])
    prisma.menu.findMany.mockResolvedValue([
      { id: 901, parentId: null, routeName: 'Product' },
      { id: 902, parentId: 901, routeName: 'ProductCatalog' },
    ])

    await service.syncBuiltIns()

    expect(prisma.menu.deleteMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [902] }, isBuiltIn: true },
    })
    expect(prisma.menu.deleteMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: [901] }, isBuiltIn: true },
    })
    expect(prisma.permission.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [801] }, isBuiltIn: true },
    })
    expect(prisma.resource.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [701] }, isBuiltIn: true },
    })
    expect(prisma.role.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [601] }, isBuiltIn: true },
    })
  })

  it('rejects stale menu cleanup when a custom menu depends on it', async () => {
    const { service, prisma } = createService()
    prepareSuccessfulSync(prisma)
    prisma.menu.findMany.mockResolvedValue([{ id: 901, parentId: null, routeName: 'Product' }])
    prisma.menu.findFirst.mockResolvedValue({
      id: 903,
      routeName: 'customProductReport',
    })

    await expect(service.syncBuiltIns()).rejects.toThrow('自定义菜单仍依赖待清理的内置菜单')
    expect(prisma.menu.deleteMany).not.toHaveBeenCalled()
  })

  it('rejects stale resource cleanup when a custom permission depends on it', async () => {
    const { service, prisma } = createService()
    prepareSuccessfulSync(prisma)
    prisma.resource.findMany.mockResolvedValue([{ id: 701, key: 'product.product' }])
    prisma.permission.findFirst.mockResolvedValue({
      id: 802,
      code: 'custom.product.export',
    })

    await expect(service.syncBuiltIns()).rejects.toThrow('自定义权限仍依赖待清理的内置资源')
    expect(prisma.resource.deleteMany).not.toHaveBeenCalled()
  })

  it('rejects stale resource cleanup when a custom menu depends on it', async () => {
    const { service, prisma } = createService()
    prepareSuccessfulSync(prisma)
    prisma.resource.findMany.mockResolvedValue([{ id: 701, key: 'product.product' }])
    prisma.menuResource.findFirst.mockResolvedValue({
      menuId: 904,
      resourceId: 701,
    })

    await expect(service.syncBuiltIns()).rejects.toThrow('自定义菜单仍依赖待清理的内置资源')
    expect(prisma.resource.deleteMany).not.toHaveBeenCalled()
  })
})
