import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import type {
  AdminPageRouteName,
  CreateSystemMenuPayload,
  SystemMenu,
  SystemMenuType,
  UpdateSystemMenuPayload,
  UpdateSystemMenuPermissionsPayload,
  UpdateSystemMenuSortPayload,
} from '@gaoge/shared-types'
import { ADMIN_PAGE_ROUTE_NAMES } from '@gaoge/shared-types/admin-page-route-names'

import { PrismaService } from '@/common/prisma/prisma.service'

@Injectable()
export class SystemMenuService {
  constructor(private readonly prisma: PrismaService) {}

  async findTree(): Promise<SystemMenu[]> {
    const menus = await this.prisma.menu.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: {
        menuPermissions: {
          include: {
            permission: true,
          },
        },
        menuResources: {
          orderBy: { sort: 'asc' },
          include: { resource: true },
        },
      },
    })

    return buildMenuTree(menus)
  }

  async create(payload: CreateSystemMenuPayload) {
    const parentId = normalizeNullableId(payload.parentId)
    const name = normalizeRequiredText(payload.name, '菜单标识不能为空')
    const path = normalizePath(payload.path)
    const routeName = normalizeRequiredText(payload.routeName, '路由名不能为空')
    assertMenuNavigation(payload.menuType, path, routeName)

    await this.ensureParentExists(parentId)
    await this.ensureUniqueRoute(routeName, null)
    await this.ensureUniqueSibling(parentId, name, path, null)

    const menu = await this.prisma.menu.create({
      data: {
        parentId,
        name,
        title: normalizeRequiredText(payload.title, '菜单标题不能为空'),
        icon: normalizeOptionalText(payload.icon),
        path,
        routeName,
        menuType: payload.menuType,
        sort: normalizeInteger(payload.sort, 0),
        status: payload.status,
        visible: Boolean(payload.visible),
      },
      include: {
        menuPermissions: {
          include: {
            permission: true,
          },
        },
        menuResources: {
          orderBy: { sort: 'asc' },
          include: { resource: true },
        },
      },
    })

    return serializeMenuNode(menu, [])
  }

  async update(id: number, payload: UpdateSystemMenuPayload) {
    const currentMenu = await this.findOneOrThrow(id)
    const parentId =
      payload.parentId === undefined ? currentMenu.parentId : normalizeNullableId(payload.parentId)
    const name = normalizeRequiredText(payload.name, '菜单标识不能为空')
    const path = normalizePath(payload.path)
    const routeName = normalizeRequiredText(payload.routeName, '路由名不能为空')
    assertMenuNavigation(payload.menuType, path, routeName)

    await this.ensureSafeParent(id, parentId)
    await this.ensureUniqueRoute(routeName, id)
    await this.ensureUniqueSibling(parentId, name, path, id)

    const menu = await this.prisma.menu.update({
      where: { id },
      data: {
        parentId,
        name,
        title: normalizeRequiredText(payload.title, '菜单标题不能为空'),
        icon: normalizeOptionalText(payload.icon),
        path,
        routeName,
        menuType: payload.menuType,
        sort: normalizeInteger(payload.sort, 0),
        status: payload.status,
        visible: Boolean(payload.visible),
      },
      include: {
        menuPermissions: {
          include: {
            permission: true,
          },
        },
        menuResources: {
          orderBy: { sort: 'asc' },
          include: { resource: true },
        },
      },
    })

    return serializeMenuNode(menu, [])
  }

  async updateSort(id: number, payload: UpdateSystemMenuSortPayload) {
    const menu = await this.findOneOrThrow(id)
    return this.update(id, {
      parentId: menu.parentId,
      name: menu.name,
      title: menu.title,
      icon: menu.icon ?? undefined,
      path: menu.path,
      routeName: menu.routeName,
      menuType: menu.menuType as SystemMenuType,
      sort: payload.sort,
      status: menu.status as 'active' | 'inactive',
      visible: menu.visible,
      expectedUpdatedAt: menu.updatedAt.toISOString(),
    })
  }

  async updatePermissions(id: number, payload: UpdateSystemMenuPermissionsPayload) {
    await this.findOneOrThrow(id)
    const permissionIds = normalizeIdList(payload.permissionIds)

    await this.prisma.$transaction(async (tx) => {
      await tx.menuPermission.deleteMany({
        where: { menuId: id },
      })
      if (permissionIds.length > 0) {
        await tx.menuPermission.createMany({
          data: permissionIds.map((permissionId) => ({
            menuId: id,
            permissionId,
          })),
          skipDuplicates: true,
        })
      }
    })

    return this.findTree()
  }

  async remove(id: number) {
    const menu = await this.findOneOrThrow(id)
    if (menu.isBuiltIn) {
      throw new BadRequestException('内置菜单不允许删除')
    }

    const childCount = await this.prisma.menu.count({
      where: {
        parentId: id,
      },
    })
    if (childCount > 0) {
      throw new BadRequestException('存在子菜单，无法删除')
    }

    await this.prisma.menu.delete({
      where: { id },
    })

    return { id }
  }

  private async findOneOrThrow(id: number) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }

    return menu
  }

  private async ensureParentExists(parentId: number | null | undefined) {
    if (parentId == null) {
      return
    }

    await this.findOneOrThrow(parentId)
  }

  private async ensureSafeParent(id: number, parentId: number | null) {
    if (parentId == null) {
      return
    }
    if (parentId === id) {
      throw new BadRequestException('父级菜单不能选择自身')
    }

    await this.findOneOrThrow(parentId)

    const menus = await this.prisma.menu.findMany({
      select: {
        id: true,
        parentId: true,
      },
    })
    const parentIdById = new Map(menus.map((menu) => [menu.id, menu.parentId]))
    let currentParentId: number | null | undefined = parentId

    while (currentParentId != null) {
      if (currentParentId === id) {
        throw new BadRequestException('父级菜单不能选择自身或子菜单')
      }
      currentParentId = parentIdById.get(currentParentId)
    }
  }

  private async ensureUniqueRoute(routeName: string, excludeId: number | null) {
    const existing = await this.prisma.menu.findUnique({
      where: {
        routeName,
      },
    })
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('路由名已存在')
    }
  }

  private async ensureUniqueSibling(
    parentId: number | null,
    name: string,
    path: string | null,
    excludeId: number | null,
  ) {
    const excludeWhere = excludeId ? { id: { not: excludeId } } : {}
    const duplicatedName = await this.prisma.menu.findFirst({
      where: {
        parentId,
        name,
        ...excludeWhere,
      },
    })
    if (duplicatedName) {
      throw new ConflictException('同级菜单标识已存在')
    }

    if (path !== null) {
      const duplicatedPath = await this.prisma.menu.findFirst({
        where: {
          parentId,
          path,
          ...excludeWhere,
        },
      })
      if (duplicatedPath) {
        throw new ConflictException('同级菜单路径已存在')
      }
    }
  }
}

type MenuRecord = {
  id: number
  parentId: number | null
  name: string
  title: string
  icon: string | null
  path: string | null
  routeName: string
  menuType: string
  sort: number
  status: string
  visible: boolean
  isBuiltIn: boolean
  createdAt: Date
  updatedAt: Date
  menuPermissions: {
    permission: {
      id: number
      code: string
      name: string
    }
  }[]
  menuResources: {
    resource: {
      id: number
      key: string
      name: string
      module: string
      status: string
    }
  }[]
}

function buildMenuTree(menus: MenuRecord[]): SystemMenu[] {
  const nodes = new Map<number, SystemMenu>()

  for (const menu of menus) {
    nodes.set(menu.id, serializeMenuNode(menu, []))
  }

  const roots: SystemMenu[] = []

  for (const menu of menus) {
    const node = nodes.get(menu.id)
    if (!node) {
      continue
    }

    if (menu.parentId && nodes.has(menu.parentId)) {
      nodes.get(menu.parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function serializeMenuNode(menu: MenuRecord, children: SystemMenu[]): SystemMenu {
  return {
    id: menu.id,
    parentId: menu.parentId,
    name: menu.name,
    title: menu.title,
    icon: menu.icon,
    path: menu.path,
    routeName: menu.routeName,
    menuType: menu.menuType as SystemMenu['menuType'],
    sort: menu.sort,
    status: menu.status as SystemMenu['status'],
    visible: menu.visible,
    isBuiltIn: menu.isBuiltIn,
    permissions: menu.menuPermissions.map((item) => ({
      id: item.permission.id,
      code: item.permission.code,
      name: item.permission.name,
    })),
    resources: menu.menuResources.map((item) => ({
      id: item.resource.id,
      key: item.resource.key,
      name: item.resource.name,
      module: item.resource.module,
      status: item.resource.status as SystemMenu['status'],
    })),
    children,
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
  }
}

function normalizeOptionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeNullableId(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeRequiredText(value: unknown, message: string) {
  const normalized = normalizeOptionalText(value)
  if (!normalized) {
    throw new BadRequestException(message)
  }

  return normalized
}

function normalizePath(value: unknown) {
  return normalizeOptionalText(value) ?? null
}

function assertMenuNavigation(menuType: SystemMenuType, path: string | null, routeName: string) {
  if (menuType === 'group' && path !== null) {
    throw new BadRequestException('导航分组不能配置路径')
  }
  if (menuType !== 'group' && !path) {
    throw new BadRequestException('只有导航分组允许空路径')
  }
  if (menuType === 'menu' && !ADMIN_PAGE_ROUTE_NAMES.includes(routeName as AdminPageRouteName)) {
    throw new BadRequestException('页面路由未在当前 Admin 版本注册')
  }
}

function normalizeInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function normalizeIdList(values: number[]) {
  return [...new Set((values ?? []).map((item) => Number(item)).filter((item) => item > 0))]
}
