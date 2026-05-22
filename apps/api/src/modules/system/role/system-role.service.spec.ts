import { BadRequestException } from '@nestjs/common'

import { SystemRoleService } from './system-role.service'

describe('SystemRoleService', () => {
  const createService = () => {
    const prisma = {
      role: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      permission: {
        findMany: jest.fn(),
      },
      menu: {
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      rolePermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (input: ((tx: any) => Promise<unknown>) | Promise<unknown>[]) => {
        if (typeof input === 'function') {
          return input(prisma)
        }

        return Promise.all(input)
      }),
    }

    const service = new SystemRoleService(prisma as any)

    return {
      prisma,
      service,
    }
  }

  const roleRecord = {
    id: 2,
    code: 'asset_admin',
    name: '资产管理员',
    description: '负责资产流水',
    status: 'active',
    sort: 20,
    isBuiltIn: false,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-02T00:00:00.000Z'),
  }

  it('returns role workspace detail with menu-scoped permission groups, global permission groups, and related users', async () => {
    const { prisma, service } = createService()

    prisma.role.findUnique.mockResolvedValue(roleRecord)
    prisma.role.findMany.mockResolvedValue([
      {
        ...roleRecord,
        _count: {
          userRoles: 1,
          rolePermissions: 3,
        },
      },
    ])
    prisma.menu.findMany.mockResolvedValue([
      {
        id: 1,
        parentId: null,
        name: 'system',
        title: '权限中心',
        icon: 'ri:settings-3-line',
        path: '/system',
        routeName: 'system',
        menuType: 'catalog',
        sort: 0,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        menuPermissions: [],
      },
      {
        id: 2,
        parentId: 1,
        name: 'systemRole',
        title: '角色中心',
        icon: null,
        path: '/system/role',
        routeName: 'systemRole',
        menuType: 'menu',
        sort: 10,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        menuPermissions: [
          {
            permission: {
              id: 11,
              code: 'system.role.view',
              name: '查看角色',
            },
          },
          {
            permission: {
              id: 14,
              code: 'system.role.assign-permission',
              name: '分配权限',
            },
          },
        ],
      },
    ])
    prisma.permission.findMany.mockResolvedValue([
      {
        id: 11,
        code: 'system.role.view',
        name: '查看角色',
        module: 'system',
        resource: 'role',
        action: 'view',
        description: 'system.role.view',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 11 }],
        menuPermissions: [{ menuId: 2, permissionId: 11 }],
      },
      {
        id: 12,
        code: 'system.role.export',
        name: '导出角色',
        module: 'system',
        resource: 'role',
        action: 'export',
        description: 'system.role.export',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 12 }],
        menuPermissions: [],
      },
      {
        id: 14,
        code: 'system.role.assign-permission',
        name: '分配权限',
        module: 'system',
        resource: 'role',
        action: 'assign-permission',
        description: 'system.role.assign-permission',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 14 }],
        menuPermissions: [{ menuId: 2, permissionId: 14 }],
      },
      {
        id: 13,
        code: 'system.user.view',
        name: '查看用户',
        module: 'system',
        resource: 'user',
        action: 'view',
        description: 'system.user.view',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [],
        menuPermissions: [{ menuId: 3, permissionId: 13 }],
      },
    ])
    prisma.user.findMany.mockResolvedValue([
      {
        id: 8,
        account: 'asset.ops',
        nickname: '资产运维',
        avatarUrl: null,
        status: 'active',
        lastLoginAt: new Date('2026-05-20T00:00:00.000Z'),
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-21T00:00:00.000Z'),
        userRoles: [
          {
            role: {
              id: 2,
              code: 'asset_admin',
              name: '资产管理员',
              status: 'active',
            },
          },
        ],
      },
    ])

    const detail = await service.getDetail(2)

    expect(detail.role.code).toBe('asset_admin')
    expect(detail.menuTree[0].children[0].checked).toBe(true)
    expect(detail.menuPermissionGroups[2]?.[0].resources[0].permissions).toEqual([
      expect.objectContaining({
        code: 'system.role.assign-permission',
        checked: true,
      }),
    ])
    expect(detail.globalPermissionGroups[0].resources[0].permissions).toEqual([
      expect.objectContaining({
        code: 'system.role.export',
        checked: true,
      }),
    ])
    expect(detail.relatedUsers).toEqual([
      expect.objectContaining({
        account: 'asset.ops',
      }),
    ])
  })

  it('saves menu access, menu-scoped actions, and global actions in one request', async () => {
    const { prisma, service } = createService()

    prisma.role.findUnique.mockResolvedValue(roleRecord)
    prisma.role.findMany.mockResolvedValue([
      {
        ...roleRecord,
        _count: {
          userRoles: 1,
          rolePermissions: 2,
        },
      },
    ])
    prisma.menu.findMany.mockResolvedValue([
      {
        id: 2,
        parentId: 1,
        name: 'systemRole',
        title: '角色中心',
        icon: null,
        path: '/system/role',
        routeName: 'systemRole',
        menuType: 'menu',
        sort: 10,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        menuPermissions: [
          {
            permission: {
              id: 11,
              code: 'system.role.view',
              name: '查看角色',
            },
          },
          {
            permission: {
              id: 14,
              code: 'system.role.assign-permission',
              name: '分配权限',
            },
          },
        ],
      },
      {
        id: 3,
        parentId: 1,
        name: 'systemUser',
        title: '用户管理',
        icon: null,
        path: '/system/user',
        routeName: 'systemUser',
        menuType: 'menu',
        sort: 20,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        menuPermissions: [
          {
            permission: {
              id: 13,
              code: 'system.user.view',
              name: '查看用户',
            },
          },
        ],
      },
    ])
    prisma.permission.findMany.mockResolvedValue([
      {
        id: 11,
        code: 'system.role.view',
        name: '查看角色',
        module: 'system',
        resource: 'role',
        action: 'view',
        description: 'system.role.view',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 11 }],
        menuPermissions: [{ menuId: 2, permissionId: 11 }],
      },
      {
        id: 12,
        code: 'system.role.export',
        name: '导出角色',
        module: 'system',
        resource: 'role',
        action: 'export',
        description: 'system.role.export',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 12 }],
        menuPermissions: [],
      },
      {
        id: 14,
        code: 'system.role.assign-permission',
        name: '分配权限',
        module: 'system',
        resource: 'role',
        action: 'assign-permission',
        description: 'system.role.assign-permission',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 14 }],
        menuPermissions: [{ menuId: 2, permissionId: 14 }],
      },
      {
        id: 13,
        code: 'system.user.view',
        name: '查看用户',
        module: 'system',
        resource: 'user',
        action: 'view',
        description: 'system.user.view',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [],
        menuPermissions: [{ menuId: 3, permissionId: 13 }],
      },
    ])
    prisma.user.findMany.mockResolvedValue([])

    await service.updateWorkspace(2, {
      menuIds: [2],
      menuPermissionIdsByMenu: {
        2: [14],
      },
      globalPermissionIds: [12],
    })

    expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
      where: {
        roleId: 2,
      },
    })
    expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        {
          roleId: 2,
          permissionId: 11,
        },
        {
          roleId: 2,
          permissionId: 12,
        },
        {
          roleId: 2,
          permissionId: 14,
        },
      ]),
      skipDuplicates: true,
    })
  })

  it('preserves hidden global permissions when workspace save omits globalPermissionIds', async () => {
    const { prisma, service } = createService()

    prisma.role.findUnique.mockResolvedValue(roleRecord)
    prisma.role.findMany.mockResolvedValue([
      {
        ...roleRecord,
        _count: {
          userRoles: 1,
          rolePermissions: 3,
        },
      },
    ])
    prisma.menu.findMany.mockResolvedValue([
      {
        id: 2,
        parentId: 1,
        name: 'systemRole',
        title: '角色中心',
        icon: null,
        path: '/system/role',
        routeName: 'systemRole',
        menuType: 'menu',
        sort: 10,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        menuPermissions: [
          {
            permission: {
              id: 11,
              code: 'system.role.view',
              name: '查看角色',
            },
          },
          {
            permission: {
              id: 14,
              code: 'system.role.assign-permission',
              name: '分配权限',
            },
          },
        ],
      },
    ])
    prisma.permission.findMany.mockResolvedValue([
      {
        id: 11,
        code: 'system.role.view',
        name: '查看角色',
        module: 'system',
        resource: 'role',
        action: 'view',
        description: 'system.role.view',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 11 }],
        menuPermissions: [{ menuId: 2, permissionId: 11 }],
      },
      {
        id: 12,
        code: 'system.role.export',
        name: '导出角色',
        module: 'system',
        resource: 'role',
        action: 'export',
        description: 'system.role.export',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 12 }],
        menuPermissions: [],
      },
      {
        id: 14,
        code: 'system.role.assign-permission',
        name: '分配权限',
        module: 'system',
        resource: 'role',
        action: 'assign-permission',
        description: 'system.role.assign-permission',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 14 }],
        menuPermissions: [{ menuId: 2, permissionId: 14 }],
      },
    ])
    prisma.user.findMany.mockResolvedValue([])

    await service.updateWorkspace(2, {
      menuIds: [2],
      menuPermissionIdsByMenu: {
        2: [14],
      },
    } as any)

    expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        {
          roleId: 2,
          permissionId: 11,
        },
        {
          roleId: 2,
          permissionId: 12,
        },
        {
          roleId: 2,
          permissionId: 14,
        },
      ]),
      skipDuplicates: true,
    })
  })

  it('clears menu-scoped actions when the parent menu is removed', async () => {
    const { prisma, service } = createService()

    prisma.role.findUnique.mockResolvedValue(roleRecord)
    prisma.role.findMany.mockResolvedValue([
      {
        ...roleRecord,
        _count: {
          userRoles: 1,
          rolePermissions: 3,
        },
      },
    ])
    prisma.menu.findMany.mockResolvedValue([
      {
        id: 2,
        parentId: 1,
        name: 'systemRole',
        title: '角色中心',
        icon: null,
        path: '/system/role',
        routeName: 'systemRole',
        menuType: 'menu',
        sort: 10,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        menuPermissions: [
          {
            permission: {
              id: 11,
              code: 'system.role.view',
              name: '查看角色',
            },
          },
          {
            permission: {
              id: 14,
              code: 'system.role.assign-permission',
              name: '分配权限',
            },
          },
        ],
      },
    ])
    prisma.permission.findMany.mockResolvedValue([
      {
        id: 11,
        code: 'system.role.view',
        name: '查看角色',
        module: 'system',
        resource: 'role',
        action: 'view',
        description: 'system.role.view',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 11 }],
        menuPermissions: [{ menuId: 2, permissionId: 11 }],
      },
      {
        id: 12,
        code: 'system.role.export',
        name: '导出角色',
        module: 'system',
        resource: 'role',
        action: 'export',
        description: 'system.role.export',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 12 }],
        menuPermissions: [],
      },
      {
        id: 14,
        code: 'system.role.assign-permission',
        name: '分配权限',
        module: 'system',
        resource: 'role',
        action: 'assign-permission',
        description: 'system.role.assign-permission',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 14 }],
        menuPermissions: [{ menuId: 2, permissionId: 14 }],
      },
    ])
    prisma.user.findMany.mockResolvedValue([])

    await service.updateWorkspace(2, {
      menuIds: [],
      menuPermissionIdsByMenu: {
        2: [14],
      },
      globalPermissionIds: [12],
    })

    expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
      data: [
        {
          roleId: 2,
          permissionId: 12,
        },
      ],
      skipDuplicates: true,
    })
  })

  it('compares role menus, action permissions, and related users', async () => {
    const { prisma, service } = createService()

    prisma.role.findUnique.mockResolvedValueOnce(roleRecord).mockResolvedValueOnce({
      ...roleRecord,
      id: 3,
      code: 'viewer',
      name: '只读管理员',
    })
    prisma.role.findMany.mockResolvedValue([
      {
        ...roleRecord,
        _count: {
          userRoles: 1,
          rolePermissions: 2,
        },
      },
      {
        ...roleRecord,
        id: 3,
        code: 'viewer',
        name: '只读管理员',
        _count: {
          userRoles: 2,
          rolePermissions: 1,
        },
      },
    ])
    prisma.menu.findMany.mockResolvedValue([
      {
        id: 2,
        parentId: 1,
        name: 'systemRole',
        title: '角色中心',
        icon: null,
        path: '/system/role',
        routeName: 'systemRole',
        menuType: 'menu',
        sort: 10,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        menuPermissions: [
          {
            permission: {
              id: 11,
              code: 'system.role.view',
              name: '查看角色',
            },
          },
          {
            permission: {
              id: 14,
              code: 'system.role.assign-permission',
              name: '分配权限',
            },
          },
        ],
      },
      {
        id: 3,
        parentId: 1,
        name: 'systemUser',
        title: '用户管理',
        icon: null,
        path: '/system/user',
        routeName: 'systemUser',
        menuType: 'menu',
        sort: 20,
        status: 'active',
        visible: true,
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        menuPermissions: [
          {
            permission: {
              id: 13,
              code: 'system.user.view',
              name: '查看用户',
            },
          },
        ],
      },
    ])
    prisma.permission.findMany.mockResolvedValue([
      {
        id: 11,
        code: 'system.role.view',
        name: '查看角色',
        module: 'system',
        resource: 'role',
        action: 'view',
        description: 'system.role.view',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 11 }],
        menuPermissions: [{ menuId: 2, permissionId: 11 }],
      },
      {
        id: 12,
        code: 'system.role.export',
        name: '导出角色',
        module: 'system',
        resource: 'role',
        action: 'export',
        description: 'system.role.export',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 12 }],
        menuPermissions: [],
      },
      {
        id: 14,
        code: 'system.role.assign-permission',
        name: '分配权限',
        module: 'system',
        resource: 'role',
        action: 'assign-permission',
        description: 'system.role.assign-permission',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 2, permissionId: 14 }],
        menuPermissions: [{ menuId: 2, permissionId: 14 }],
      },
      {
        id: 13,
        code: 'system.user.view',
        name: '查看用户',
        module: 'system',
        resource: 'user',
        action: 'view',
        description: 'system.user.view',
        status: 'active',
        isBuiltIn: true,
        createdAt: new Date('2026-05-01T00:00:00.000Z'),
        updatedAt: new Date('2026-05-02T00:00:00.000Z'),
        rolePermissions: [{ roleId: 3, permissionId: 13 }],
        menuPermissions: [{ menuId: 3, permissionId: 13 }],
      },
    ])
    prisma.user.findMany
      .mockResolvedValueOnce([
        {
          id: 8,
          account: 'asset.ops',
          nickname: '资产运维',
          avatarUrl: null,
          status: 'active',
          lastLoginAt: new Date('2026-05-20T00:00:00.000Z'),
          createdAt: new Date('2026-05-01T00:00:00.000Z'),
          updatedAt: new Date('2026-05-21T00:00:00.000Z'),
          userRoles: [
            {
              role: {
                id: 2,
                code: 'asset_admin',
                name: '资产管理员',
                status: 'active',
              },
            },
          ],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 9,
          account: 'viewer.ops',
          nickname: '只读运维',
          avatarUrl: null,
          status: 'active',
          lastLoginAt: null,
          createdAt: new Date('2026-05-03T00:00:00.000Z'),
          updatedAt: new Date('2026-05-21T00:00:00.000Z'),
          userRoles: [
            {
              role: {
                id: 3,
                code: 'viewer',
                name: '只读管理员',
                status: 'active',
              },
            },
          ],
        },
      ])

    const diff = await service.compare(2, 3)

    expect(diff.menuDiff.added).toEqual([
      expect.objectContaining({
        key: '2',
        label: '角色中心',
      }),
    ])
    expect(diff.menuDiff.removed).toEqual([
      expect.objectContaining({
        key: '3',
        label: '用户管理',
      }),
    ])
    expect(diff.permissionDiff.added).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'system.role.export',
        }),
        expect.objectContaining({
          key: 'system.role.assign-permission',
        }),
      ]),
    )
    expect(diff.userDiff.added).toEqual([
      expect.objectContaining({
        key: 'asset.ops',
      }),
    ])
  })

  it('rejects empty workspace menus for super admin role', async () => {
    const { prisma, service } = createService()

    prisma.role.findUnique.mockResolvedValue({
      ...roleRecord,
      code: 'super_admin',
    })

    await expect(
      service.updateWorkspace(2, {
        menuIds: [],
        menuPermissionIdsByMenu: {},
        globalPermissionIds: [12],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
