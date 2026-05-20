import { RbacSyncService } from './rbac-sync.service'

describe('RbacSyncService', () => {
  const createService = () => {
    const prisma = {
      role: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      permission: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      menu: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      rolePermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      menuPermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      userRole: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prisma)),
    }

    return {
      prisma,
      service: new RbacSyncService(prisma as any),
    }
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
    prisma.menu.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.routeName === 'system' ? 10 : create.routeName.length,
      ...update,
      ...create,
    }))
    prisma.user.findMany.mockResolvedValue([
      { id: 8, role: 'admin', account: 'admin' },
      { id: 9, role: 'viewer', account: 'viewer' },
      { id: 10, role: 'user', account: null },
    ])

    const result = await service.syncBuiltIns()

    expect(prisma.role.upsert).toHaveBeenCalled()
    expect(prisma.permission.upsert).toHaveBeenCalled()
    expect(prisma.menu.upsert).toHaveBeenCalled()
    expect(prisma.rolePermission.deleteMany).toHaveBeenCalled()
    expect(prisma.rolePermission.createMany).toHaveBeenCalled()
    expect(prisma.menuPermission.deleteMany).toHaveBeenCalled()
    expect(prisma.menuPermission.createMany).toHaveBeenCalled()
    expect(prisma.userRole.upsert).toHaveBeenCalledTimes(2)
    expect(result.roles).toBeGreaterThanOrEqual(2)
    expect(result.permissions).toBeGreaterThan(0)
    expect(result.menus).toBeGreaterThanOrEqual(5)
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
    prisma.menu.upsert.mockImplementation(async ({ create, update }: any) => ({
      id: create.routeName === 'system' ? 10 : create.routeName.length,
      ...update,
      ...create,
    }))
    prisma.user.findMany.mockResolvedValue([])

    await service.syncBuiltIns()

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
})
