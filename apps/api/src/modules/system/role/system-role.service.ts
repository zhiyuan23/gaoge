import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import type {
  CreateSystemRolePayload,
  SystemRoleComparison,
  SystemRoleComparisonItem,
  SystemRoleMenuNode,
  SystemRolePermissionModule,
  SystemRoleRelatedUser,
  SystemRoleWorkspaceDetail,
  UpdateSystemRoleMenuAccessPayload,
  UpdateSystemRolePayload,
  UpdateSystemRolePermissionsPayload,
  UpdateSystemRoleStatusPayload,
  UpdateSystemRoleWorkspacePayload,
} from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'

@Injectable()
export class SystemRoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.role.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    })

    return list.map(serializeRoleSummary)
  }

  async getDetail(id: number): Promise<SystemRoleWorkspaceDetail> {
    await this.findOneOrThrow(id)

    const [roles, menus, permissions, users] = await Promise.all([
      this.findAll(),
      this.loadMenuRecords(),
      this.loadPermissionRecords(id),
      this.loadRelatedUsers(id),
    ])

    const role = roles.find((item) => item.id === id)
    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    const selectedPermissionIds = getSelectedPermissionIdSet(permissions, id)
    const permissionMap = createPermissionMap(permissions)

    return {
      role,
      menuTree: buildRoleMenuTree(menus, selectedPermissionIds, permissionMap),
      menuPermissionGroups: buildRoleMenuPermissionGroups(
        menus,
        permissions,
        selectedPermissionIds,
      ),
      globalPermissionGroups: buildGlobalPermissionGroups(permissions, selectedPermissionIds),
      relatedUsers: users.map(serializeRelatedUser),
    }
  }

  async compare(id: number, targetRoleId: number): Promise<SystemRoleComparison> {
    const [leftDetail, rightDetail] = await Promise.all([
      this.getDetail(id),
      this.getDetail(targetRoleId),
    ])

    return {
      leftRole: leftDetail.role,
      rightRole: rightDetail.role,
      menuDiff: buildDiff(
        flattenCheckedMenuItems(leftDetail.menuTree),
        flattenCheckedMenuItems(rightDetail.menuTree),
      ),
      permissionDiff: buildDiff(
        flattenCheckedWorkspacePermissionItems(leftDetail),
        flattenCheckedWorkspacePermissionItems(rightDetail),
      ),
      userDiff: buildDiff(
        leftDetail.relatedUsers.map((item) => ({
          key: item.account,
          label: item.nickname ? `${item.nickname} (${item.account})` : item.account,
        })),
        rightDetail.relatedUsers.map((item) => ({
          key: item.account,
          label: item.nickname ? `${item.nickname} (${item.account})` : item.account,
        })),
      ),
    }
  }

  async create(payload: CreateSystemRolePayload) {
    const code = normalizeRequiredText(payload.code, '角色编码不能为空')
    const existing = await this.prisma.role.findUnique({ where: { code } })
    if (existing) {
      throw new ConflictException('角色编码已存在')
    }

    const role = await this.prisma.role.create({
      data: {
        code,
        name: normalizeRequiredText(payload.name, '角色名称不能为空'),
        description: normalizeOptionalText(payload.description),
        status: payload.status,
        sort: normalizeInteger(payload.sort, 0),
      },
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    })

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      status: role.status,
      sort: role.sort,
      isBuiltIn: role.isBuiltIn,
      permissionCount: role._count.rolePermissions,
      userCount: role._count.userRoles,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }
  }

  async update(id: number, payload: UpdateSystemRolePayload) {
    await this.findOneOrThrow(id)

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: normalizeRequiredText(payload.name, '角色名称不能为空'),
        description: normalizeOptionalText(payload.description),
        status: payload.status,
        sort: normalizeInteger(payload.sort, 0),
      },
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    })

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      status: role.status,
      sort: role.sort,
      isBuiltIn: role.isBuiltIn,
      permissionCount: role._count.rolePermissions,
      userCount: role._count.userRoles,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }
  }

  async updateStatus(id: number, payload: UpdateSystemRoleStatusPayload) {
    const role = await this.findOneOrThrow(id)
    if (role.code === 'super_admin' && payload.status === 'inactive') {
      throw new BadRequestException('内置超级管理员角色不允许停用')
    }

    return this.update(id, {
      name: role.name,
      description: role.description ?? undefined,
      status: payload.status,
      sort: role.sort,
    })
  }

  async getPermissions(id: number) {
    await this.findOneOrThrow(id)

    const permissions = await this.prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            roleId: id,
          },
        },
      },
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    })

    return permissions.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      module: item.module,
      resource: item.resource,
      action: item.action,
      description: item.description,
      status: item.status,
      isBuiltIn: item.isBuiltIn,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  }

  async updatePermissions(id: number, payload: UpdateSystemRolePermissionsPayload) {
    const role = await this.findOneOrThrow(id)
    const permissions = await this.loadPermissionRecords(id)
    const permissionIds = normalizeIdList(payload.permissionIds)
    const menuManagedPermissionIds = getMenuManagedPermissionIdSetFromPermissions(permissions)
    const preservedMenuPermissionIds = [...getSelectedPermissionIdSet(permissions, id)].filter(
      (item) => menuManagedPermissionIds.has(item),
    )
    const finalPermissionIds = [...new Set([...preservedMenuPermissionIds, ...permissionIds])]

    if (role.code === 'super_admin' && finalPermissionIds.length === 0) {
      throw new BadRequestException('超级管理员角色必须保留权限')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: {
          roleId: id,
          permissionId: {
            in: permissions
              .filter((item) => !menuManagedPermissionIds.has(item.id))
              .map((item) => item.id),
          },
        },
      })
      if (finalPermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: finalPermissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        })
      }
    })

    return this.getPermissions(id)
  }

  async updateWorkspace(id: number, payload: UpdateSystemRoleWorkspacePayload) {
    const role = await this.findOneOrThrow(id)
    const selectedMenuIds = normalizeIdList(payload.menuIds)

    if (role.code === 'super_admin' && selectedMenuIds.length === 0) {
      throw new BadRequestException('超级管理员角色必须保留菜单访问')
    }

    const [menus, permissions] = await Promise.all([
      this.loadMenuRecords(),
      this.loadPermissionRecords(id),
    ])
    const selectedPermissionIds = getSelectedPermissionIdSet(permissions, id)

    const existingMenuIds = new Set(menus.map((item) => item.id))
    const invalidMenuIds = selectedMenuIds.filter((item) => !existingMenuIds.has(item))
    if (invalidMenuIds.length > 0) {
      throw new BadRequestException('存在无效菜单')
    }

    const finalPermissionIds = buildWorkspacePermissionIds({
      menus,
      permissions,
      selectedMenuIds,
      menuPermissionIdsByMenu: payload.menuPermissionIdsByMenu,
      globalPermissionIds:
        payload.globalPermissionIds ??
        permissions
          .filter((item) => item.menuPermissions.length === 0 && selectedPermissionIds.has(item.id))
          .map((item) => item.id),
    })

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: {
          roleId: id,
        },
      })

      if (finalPermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: finalPermissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        })
      }
    })

    return this.getDetail(id)
  }

  async updateMenuAccess(id: number, payload: UpdateSystemRoleMenuAccessPayload) {
    const role = await this.findOneOrThrow(id)
    const selectedMenuIds = normalizeIdList(payload.menuIds)

    if (role.code === 'super_admin' && selectedMenuIds.length === 0) {
      throw new BadRequestException('超级管理员角色必须保留菜单访问')
    }

    const [menus, permissions] = await Promise.all([
      this.loadMenuRecords(),
      this.loadPermissionRecords(id),
    ])

    const existingMenuIds = new Set(menus.map((item) => item.id))
    const invalidMenuIds = selectedMenuIds.filter((item) => !existingMenuIds.has(item))
    if (invalidMenuIds.length > 0) {
      throw new BadRequestException('存在无效菜单')
    }

    const menuManagedPermissionIds = getMenuManagedPermissionIdSet(menus)
    const permissionMap = createPermissionMap(permissions)
    const selectedMenuPermissionIds = getSelectedMenuPermissionIds(
      menus,
      selectedMenuIds,
      permissionMap,
    )
    const currentStandalonePermissionIds = [...getSelectedPermissionIdSet(permissions, id)].filter(
      (item) => !menuManagedPermissionIds.has(item),
    )
    const finalPermissionIds = [
      ...new Set([...currentStandalonePermissionIds, ...selectedMenuPermissionIds]),
    ]

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: {
          roleId: id,
          permissionId: {
            in: [...menuManagedPermissionIds],
          },
        },
      })

      if (finalPermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: finalPermissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        })
      }
    })

    return this.getDetail(id)
  }

  async remove(id: number) {
    const role = await this.findOneOrThrow(id)
    if (role.isBuiltIn) {
      throw new BadRequestException('内置角色不允许删除')
    }

    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    })
    if (userCount > 0) {
      throw new BadRequestException('角色已绑定用户，无法删除')
    }

    await this.prisma.role.delete({
      where: { id },
    })

    return { id }
  }

  private async findOneOrThrow(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    })
    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    return role
  }

  private async loadMenuRecords() {
    return this.prisma.menu.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        menuPermissions: {
          include: {
            permission: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    })
  }

  private async loadPermissionRecords(roleId: number) {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }, { code: 'asc' }],
      include: {
        rolePermissions: {
          where: {
            roleId,
          },
          select: {
            roleId: true,
            permissionId: true,
          },
        },
        menuPermissions: {
          select: {
            menuId: true,
            permissionId: true,
          },
        },
      },
    })
  }

  private async loadRelatedUsers(roleId: number) {
    return this.prisma.user.findMany({
      where: {
        account: {
          not: null,
        },
        deletedAt: null,
        userRoles: {
          some: {
            roleId,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        account: true,
        nickname: true,
        avatarUrl: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    })
  }
}

function serializeRoleSummary(item: {
  id: number
  code: string
  name: string
  description: string | null
  status: string
  sort: number
  isBuiltIn: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    userRoles: number
    rolePermissions: number
  }
}): SystemRoleWorkspaceDetail['role'] {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    status: item.status as SystemRoleWorkspaceDetail['role']['status'],
    sort: item.sort,
    isBuiltIn: item.isBuiltIn,
    permissionCount: item._count.rolePermissions,
    userCount: item._count.userRoles,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

function serializeRelatedUser(item: {
  id: number
  account: string | null
  nickname: string | null
  avatarUrl: string | null
  status: string
  lastLoginAt: Date | null
  userRoles: {
    role: {
      id: number
      code: string
      name: string
      status: string
    }
  }[]
}): SystemRoleRelatedUser {
  return {
    id: item.id,
    account: item.account ?? '',
    nickname: item.nickname,
    avatarUrl: item.avatarUrl,
    status: item.status as SystemRoleRelatedUser['status'],
    roleCount: item.userRoles.length,
    roles: item.userRoles.map((entry) => ({
      id: entry.role.id,
      code: entry.role.code,
      name: entry.role.name,
      status: entry.role.status as SystemRoleRelatedUser['roles'][number]['status'],
    })),
    lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
  }
}

function buildRoleMenuTree(
  menus: Array<{
    id: number
    parentId: number | null
    name: string
    title: string
    path: string
    routeName: string
    menuType: string
    status: string
    visible: boolean
    isBuiltIn: boolean
    menuPermissions: {
      permission: {
        id: number
      }
    }[]
  }>,
  selectedPermissionIds: Set<number>,
  permissionMap: Map<
    number,
    {
      action: string
    }
  >,
) {
  const nodes = new Map<number, SystemRoleMenuNode>()

  for (const menu of menus) {
    const permissionIds = getMenuAccessPermissionIds(menu, permissionMap)

    nodes.set(menu.id, {
      id: menu.id,
      parentId: menu.parentId,
      name: menu.name,
      title: menu.title,
      path: menu.path,
      routeName: menu.routeName,
      menuType: menu.menuType as SystemRoleMenuNode['menuType'],
      status: menu.status as SystemRoleMenuNode['status'],
      visible: menu.visible,
      isBuiltIn: menu.isBuiltIn,
      permissionIds,
      checked: false,
      indeterminate: false,
      children: [],
    })
  }

  const roots: SystemRoleMenuNode[] = []

  for (const menu of menus) {
    const node = nodes.get(menu.id)
    if (!node) {
      continue
    }

    if (menu.parentId && nodes.has(menu.parentId)) {
      nodes.get(menu.parentId)?.children.push(node)
      continue
    }

    roots.push(node)
  }

  const applyState = (node: SystemRoleMenuNode) => {
    node.children.forEach(applyState)

    const ownAllChecked =
      node.permissionIds.length > 0 &&
      node.permissionIds.every((permissionId) => selectedPermissionIds.has(permissionId))
    const ownPartiallyChecked =
      node.permissionIds.some((permissionId) => selectedPermissionIds.has(permissionId)) &&
      !ownAllChecked
    const childChecked = node.children.some((child) => child.checked || child.indeterminate)
    const childAllChecked =
      node.children.length > 0 &&
      node.children.every((child) => child.checked && !child.indeterminate)

    if (node.permissionIds.length === 0) {
      node.checked = childAllChecked
      node.indeterminate = childChecked && !childAllChecked
      return
    }

    node.checked = ownAllChecked
    node.indeterminate = ownPartiallyChecked || childChecked
  }

  roots.forEach(applyState)

  return roots
}

function buildRoleMenuPermissionGroups(
  menus: Array<{
    id: number
    menuPermissions: {
      permission: {
        id: number
      }
    }[]
  }>,
  permissions: Array<{
    id: number
    code: string
    name: string
    module: string
    resource: string
    action: string
    description: string | null
    status: string
    isBuiltIn: boolean
    menuPermissions: {
      menuId: number
      permissionId: number
    }[]
  }>,
  selectedPermissionIds: Set<number>,
): Record<number, SystemRolePermissionModule[]> {
  const permissionMap = createPermissionMap(permissions)
  const groupsByMenu: Record<number, SystemRolePermissionModule[]> = {}

  for (const menu of menus) {
    const accessPermissionIdSet = new Set(getMenuAccessPermissionIds(menu, permissionMap))
    const menuActionPermissionIds = menu.menuPermissions
      .map((item) => item.permission.id)
      .filter((permissionId) => !accessPermissionIdSet.has(permissionId))

    groupsByMenu[menu.id] = buildPermissionGroups(
      permissions.filter((item) => menuActionPermissionIds.includes(item.id)),
      selectedPermissionIds,
    )
  }

  return groupsByMenu
}

function buildGlobalPermissionGroups(
  permissions: Array<{
    id: number
    code: string
    name: string
    module: string
    resource: string
    action: string
    description: string | null
    status: string
    isBuiltIn: boolean
    menuPermissions: {
      menuId: number
      permissionId: number
    }[]
  }>,
  selectedPermissionIds: Set<number>,
): SystemRolePermissionModule[] {
  return buildPermissionGroups(
    permissions.filter((item) => item.menuPermissions.length === 0),
    selectedPermissionIds,
  )
}

function buildPermissionGroups(
  permissions: Array<{
    id: number
    code: string
    name: string
    module: string
    resource: string
    action: string
    description: string | null
    status: string
    isBuiltIn: boolean
  }>,
  selectedPermissionIds: Set<number>,
): SystemRolePermissionModule[] {
  const modules = new Map<string, SystemRolePermissionModule>()

  for (const permission of permissions) {
    const currentModule = modules.get(permission.module) ?? {
      module: permission.module,
      label: permission.module,
      resources: [],
    }

    let resourceGroup = currentModule.resources.find(
      (item) => item.resource === permission.resource,
    )
    if (!resourceGroup) {
      resourceGroup = {
        resource: permission.resource,
        label: permission.resource,
        selectedCount: 0,
        permissions: [],
      }
      currentModule.resources.push(resourceGroup)
    }

    resourceGroup.permissions.push({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      action: permission.action,
      description: permission.description,
      status:
        permission.status as SystemRolePermissionModule['resources'][number]['permissions'][number]['status'],
      isBuiltIn: permission.isBuiltIn,
      checked: selectedPermissionIds.has(permission.id),
    })
    resourceGroup.selectedCount = resourceGroup.permissions.filter((item) => item.checked).length
    modules.set(permission.module, currentModule)
  }

  return [...modules.values()]
}

function createPermissionMap(
  permissions: Array<{
    id: number
    action: string
  }>,
) {
  return new Map(permissions.map((item) => [item.id, item]))
}

function getMenuAccessPermissionIds(
  menu: {
    menuPermissions: {
      permission: {
        id: number
      }
    }[]
  },
  permissionMap: Map<
    number,
    {
      action: string
    }
  >,
) {
  const permissionIds = menu.menuPermissions.map((item) => item.permission.id)
  const viewPermissionIds = permissionIds.filter(
    (permissionId) => permissionMap.get(permissionId)?.action === 'view',
  )

  return viewPermissionIds.length > 0 ? viewPermissionIds : permissionIds
}

function flattenCheckedMenuItems(menuTree: SystemRoleMenuNode[]) {
  const items: SystemRoleComparisonItem[] = []

  const visit = (node: SystemRoleMenuNode) => {
    if (node.checked && node.permissionIds.length > 0) {
      items.push({
        key: String(node.id),
        label: node.title,
      })
    }
    node.children.forEach(visit)
  }

  menuTree.forEach(visit)

  return items
}

function flattenCheckedPermissionItems(groups: SystemRolePermissionModule[]) {
  return groups.flatMap((group) =>
    group.resources.flatMap((resource) =>
      resource.permissions
        .filter((item) => item.checked)
        .map((item) => ({
          key: item.code,
          label: `${group.module}.${resource.resource}.${item.action}`,
        })),
    ),
  )
}

function flattenCheckedWorkspacePermissionItems(detail: SystemRoleWorkspaceDetail) {
  return [
    ...Object.values(detail.menuPermissionGroups).flatMap((groups) =>
      flattenCheckedPermissionItems(groups),
    ),
    ...flattenCheckedPermissionItems(detail.globalPermissionGroups),
  ]
}

function buildDiff(left: SystemRoleComparisonItem[], right: SystemRoleComparisonItem[]) {
  const rightKeys = new Set(right.map((item) => item.key))
  const leftKeys = new Set(left.map((item) => item.key))

  return {
    added: left.filter((item) => !rightKeys.has(item.key)),
    removed: right.filter((item) => !leftKeys.has(item.key)),
  }
}

function getSelectedPermissionIdSet(
  permissions: Array<{
    id: number
    rolePermissions: {
      roleId: number
      permissionId: number
    }[]
  }>,
  roleId: number,
) {
  return new Set(
    permissions
      .filter((item) => item.rolePermissions.some((entry) => entry.roleId === roleId))
      .map((item) => item.id),
  )
}

function getMenuManagedPermissionIdSet(
  menus: Array<{
    menuPermissions: {
      permission: {
        id: number
      }
    }[]
  }>,
) {
  return new Set(menus.flatMap((menu) => menu.menuPermissions.map((item) => item.permission.id)))
}

function getMenuManagedPermissionIdSetFromPermissions(
  permissions: Array<{
    id: number
    menuPermissions: {
      menuId: number
      permissionId: number
    }[]
  }>,
) {
  return new Set(
    permissions.filter((item) => item.menuPermissions.length > 0).map((item) => item.id),
  )
}

function getSelectedMenuPermissionIds(
  menus: Array<{
    id: number
    menuPermissions: {
      permission: {
        id: number
      }
    }[]
  }>,
  selectedMenuIds: number[],
  permissionMap: Map<
    number,
    {
      action: string
    }
  >,
) {
  const menuIdSet = new Set(selectedMenuIds)

  return menus
    .filter((menu) => menuIdSet.has(menu.id))
    .flatMap((menu) => getMenuAccessPermissionIds(menu, permissionMap))
}

function buildWorkspacePermissionIds(input: {
  menus: Array<{
    id: number
    menuPermissions: {
      permission: {
        id: number
      }
    }[]
  }>
  permissions: Array<{
    id: number
    action: string
    menuPermissions: {
      menuId: number
      permissionId: number
    }[]
  }>
  selectedMenuIds: number[]
  menuPermissionIdsByMenu: Record<number, number[]>
  globalPermissionIds: number[]
}) {
  const permissionMap = createPermissionMap(input.permissions)
  const globalPermissionIdSet = new Set(
    input.permissions.filter((item) => item.menuPermissions.length === 0).map((item) => item.id),
  )
  const selectedMenuAccessPermissionIds = getSelectedMenuPermissionIds(
    input.menus,
    input.selectedMenuIds,
    permissionMap,
  )
  const selectedMenuIdSet = new Set(input.selectedMenuIds)
  const menuActionPermissionIds = input.menus.flatMap((menu) => {
    if (!selectedMenuIdSet.has(menu.id)) {
      return []
    }

    const accessPermissionIdSet = new Set(getMenuAccessPermissionIds(menu, permissionMap))
    const availableActionPermissionIds = new Set(
      menu.menuPermissions
        .map((item) => item.permission.id)
        .filter((permissionId) => !accessPermissionIdSet.has(permissionId)),
    )

    return normalizeIdList(input.menuPermissionIdsByMenu?.[menu.id] ?? []).filter((permissionId) =>
      availableActionPermissionIds.has(permissionId),
    )
  })
  const globalPermissionIds = normalizeIdList(input.globalPermissionIds).filter((permissionId) =>
    globalPermissionIdSet.has(permissionId),
  )

  return normalizeIdList([
    ...selectedMenuAccessPermissionIds,
    ...menuActionPermissionIds,
    ...globalPermissionIds,
  ])
}

function normalizeOptionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeRequiredText(value: unknown, message: string) {
  const normalized = normalizeOptionalText(value)
  if (!normalized) {
    throw new BadRequestException(message)
  }

  return normalized
}

function normalizeInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function normalizeIdList(values: number[]) {
  return [...new Set((values ?? []).map((item) => Number(item)).filter((item) => item > 0))]
}
