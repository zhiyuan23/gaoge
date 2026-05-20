import { BadRequestException, ConflictException } from '@nestjs/common'

import { SystemMenuService } from './system-menu.service'

describe('SystemMenuService', () => {
  const now = new Date('2026-05-20T00:00:00.000Z')

  const createService = () => {
    const prisma = {
      menu: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      menuPermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prisma)),
    }

    return {
      prisma,
      service: new SystemMenuService(prisma as any),
    }
  }

  const menuRecord = {
    id: 1,
    parentId: null,
    name: 'system',
    title: '系统管理',
    icon: 'ri:settings-3-line',
    path: '/system',
    routeName: 'system',
    menuType: 'catalog',
    sort: 0,
    status: 'active',
    visible: true,
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
  }

  it('rejects duplicate sibling name and path when creating menus', async () => {
    const { prisma, service } = createService()
    prisma.menu.findUnique
      .mockResolvedValueOnce({ ...menuRecord, id: 1 })
      .mockResolvedValueOnce(null)
    prisma.menu.findFirst.mockResolvedValueOnce({ id: 9, name: 'user' })

    await expect(
      service.create({
        parentId: 1,
        name: 'user',
        title: '用户管理',
        path: '/system/user',
        routeName: 'systemUser',
        menuType: 'menu',
        status: 'active',
        visible: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException)

    prisma.menu.findUnique
      .mockResolvedValueOnce({ ...menuRecord, id: 1 })
      .mockResolvedValueOnce(null)
    prisma.menu.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 10 })
    await expect(
      service.create({
        parentId: 1,
        name: 'role',
        title: '角色管理',
        path: '/system/user',
        routeName: 'systemRole',
        menuType: 'menu',
        status: 'active',
        visible: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException)

    expect(prisma.menu.create).not.toHaveBeenCalled()
  })

  it('updates parentId and rejects moving a menu under itself or a descendant', async () => {
    const { prisma, service } = createService()
    prisma.menu.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.routeName) {
        return null
      }
      if (where.id === 1) {
        return menuRecord
      }
      if (where.id === 2) {
        return { ...menuRecord, id: 2, parentId: 1 }
      }
      if (where.id === 3) {
        return { ...menuRecord, id: 3, parentId: 2 }
      }
      if (where.id === 4) {
        return { ...menuRecord, id: 4, parentId: null }
      }
      return null
    })
    prisma.menu.findMany.mockResolvedValue([
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
      { id: 3, parentId: 2 },
      { id: 4, parentId: null },
    ])
    prisma.menu.findFirst.mockResolvedValue(null)
    prisma.menu.update.mockResolvedValue({
      ...menuRecord,
      parentId: 4,
      menuPermissions: [],
    })

    await expect(
      service.update(1, {
        parentId: 1,
        name: 'system',
        title: '系统管理',
        icon: 'ri:settings-3-line',
        path: '/system',
        routeName: 'system',
        menuType: 'catalog',
        sort: 0,
        status: 'active',
        visible: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException)

    await expect(
      service.update(1, {
        parentId: 3,
        name: 'system',
        title: '系统管理',
        icon: 'ri:settings-3-line',
        path: '/system',
        routeName: 'system',
        menuType: 'catalog',
        sort: 0,
        status: 'active',
        visible: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException)

    await service.update(1, {
      parentId: 4,
      name: 'system',
      title: '系统管理',
      icon: 'ri:settings-3-line',
      path: '/system',
      routeName: 'system',
      menuType: 'catalog',
      sort: 0,
      status: 'active',
      visible: true,
    })

    expect(prisma.menu.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          parentId: 4,
        }),
      }),
    )
  })

  it('rejects duplicate sibling name and path when updating menus', async () => {
    const { prisma, service } = createService()
    prisma.menu.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.routeName) {
        return null
      }
      if (where.id === 1) {
        return menuRecord
      }
      if (where.id === 2) {
        return { ...menuRecord, id: 2, parentId: null, name: 'user', path: '/system/user' }
      }
      if (where.id === 3) {
        return { ...menuRecord, id: 3, parentId: null, name: 'role', path: '/system/role' }
      }
      return null
    })
    prisma.menu.findFirst.mockResolvedValueOnce({ id: 2 }).mockResolvedValueOnce({ id: 3 })

    await expect(
      service.update(1, {
        parentId: null,
        name: 'user',
        title: '系统管理',
        icon: 'ri:settings-3-line',
        path: '/system/role',
        routeName: 'system',
        menuType: 'catalog',
        sort: 0,
        status: 'active',
        visible: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException)

    prisma.menu.findFirst.mockReset()
    prisma.menu.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 3 })

    await expect(
      service.update(1, {
        parentId: null,
        name: 'system',
        title: '系统管理',
        icon: 'ri:settings-3-line',
        path: '/system/role',
        routeName: 'system',
        menuType: 'catalog',
        sort: 0,
        status: 'active',
        visible: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException)

    expect(prisma.menu.update).not.toHaveBeenCalled()
  })

  it('blocks deleting built-in menus and menus with children', async () => {
    const { prisma, service } = createService()
    prisma.menu.findUnique.mockResolvedValueOnce({ ...menuRecord, isBuiltIn: true })

    await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException)

    prisma.menu.findUnique.mockResolvedValueOnce({ ...menuRecord, isBuiltIn: false })
    prisma.menu.count.mockResolvedValueOnce(1)

    await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.menu.delete).not.toHaveBeenCalled()
  })
})
