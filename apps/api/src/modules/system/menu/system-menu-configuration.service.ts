import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type {
  AdminPageRouteName,
  CreateSystemMenuPayload,
  SystemMenuType,
  UpdateSystemMenuPayload,
  UpdateSystemMenuPermissionsPayload,
  UpdateSystemMenuResourcesPayload,
  UpdateSystemMenuSortPayload,
} from '@gaoge/shared-types'
import { ADMIN_PAGE_ROUTE_NAMES } from '@gaoge/shared-types/admin-page-route-names'

import { AuditLogService } from '@/common/audit/audit-log.service'
import { PrismaService } from '@/common/prisma/prisma.service'

import { assertExpectedUpdatedAt, runSerializable } from '../system-transaction'

const menuConfigurationInclude = {
  menuPermissions: { include: { permission: true } },
  menuResources: {
    orderBy: { sort: 'asc' as const },
    include: { resource: true },
  },
} satisfies Prisma.MenuInclude

@Injectable()
export class SystemMenuConfigurationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  create(payload: CreateSystemMenuPayload, actorUserId?: number) {
    return runSerializable(this.prisma, async (tx) => {
      if ((payload as CreateSystemMenuPayload & { isBuiltIn?: boolean }).isBuiltIn === true) {
        throw new BadRequestException('内置菜单只能由系统配置创建')
      }
      const normalized = normalizeMenuPayload(payload)
      await this.ensureParentExists(tx, normalized.parentId)
      await this.ensureUnique(
        tx,
        normalized.parentId,
        normalized.name,
        normalized.path,
        normalized.routeName,
      )
      const menu = await tx.menu.create({ data: normalized.data })
      await replaceResources(tx, menu.id, menu.menuType, normalizeIds(payload.resourceIds ?? []))
      await this.audit.record(
        {
          action: 'SYSTEM_MENU_CREATED',
          actorUserId,
          entityType: 'Menu',
          entityId: menu.id,
          metadata: { resourceIds: payload.resourceIds ?? [] },
        },
        tx,
      )
      return this.findSerialized(tx, menu.id)
    })
  }

  update(id: number, payload: UpdateSystemMenuPayload, actorUserId?: number) {
    return runSerializable(this.prisma, async (tx) => {
      const current = await this.findOne(tx, id)
      assertExpectedUpdatedAt(current.updatedAt, payload.expectedUpdatedAt)
      if (current.isBuiltIn) {
        assertBuiltInPayloadUnchanged(current, payload)
      }
      const normalized = normalizeMenuPayload(payload)
      if (current.isBuiltIn) {
        await tx.menu.update({
          where: { id },
          data: {
            title: normalized.data.title,
            icon: normalized.data.icon,
            sort: normalized.data.sort,
            status: normalized.data.status,
            visible: normalized.data.visible,
          },
        })
      } else {
        await this.ensureSafeParent(tx, id, normalized.parentId)
        await this.ensureUnique(
          tx,
          normalized.parentId,
          normalized.name,
          normalized.path,
          normalized.routeName,
          id,
        )
        await tx.menu.update({ where: { id }, data: normalized.data })
        if (payload.resourceIds !== undefined || payload.menuType === 'group') {
          await replaceResources(tx, id, payload.menuType, normalizeIds(payload.resourceIds ?? []))
        }
      }
      await this.audit.record(
        {
          action: 'SYSTEM_MENU_UPDATED',
          actorUserId,
          entityType: 'Menu',
          entityId: id,
          metadata:
            payload.resourceIds === undefined ? undefined : { resourceIds: payload.resourceIds },
        },
        tx,
      )
      return this.findSerialized(tx, id)
    })
  }

  async updateSort(id: number, payload: UpdateSystemMenuSortPayload, actorUserId?: number) {
    const menu = await this.findOne(this.prisma, id)
    return this.update(
      id,
      {
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
        resourceIds: menu.menuResources.map((relation) => relation.resourceId),
        expectedUpdatedAt: menu.updatedAt.toISOString(),
      },
      actorUserId,
    )
  }

  updateResources(id: number, payload: UpdateSystemMenuResourcesPayload, actorUserId?: number) {
    return runSerializable(this.prisma, async (tx) => {
      const menu = await this.findOne(tx, id)
      assertExpectedUpdatedAt(menu.updatedAt, payload.expectedUpdatedAt)
      const resourceIds = normalizeIds(payload.resourceIds)
      if (menu.isBuiltIn) {
        assertUnchangedResourceIds(menu, resourceIds)
        return serializeMenu(menu)
      }
      await replaceResources(tx, id, menu.menuType, resourceIds)
      await tx.menu.update({ where: { id }, data: { updatedAt: new Date() } })
      await this.audit.record(
        {
          action: 'SYSTEM_MENU_RESOURCES_REPLACED',
          actorUserId,
          entityType: 'Menu',
          entityId: id,
          metadata: { resourceIds },
        },
        tx,
      )
      return this.findSerialized(tx, id)
    })
  }

  async updatePermissions(
    id: number,
    payload: UpdateSystemMenuPermissionsPayload,
    actorUserId?: number,
  ) {
    const permissionIds = normalizeIds(payload.permissionIds)
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true, action: true, resourceId: true },
    })
    if (
      permissions.length !== permissionIds.length ||
      permissions.some((item) => item.action !== 'view')
    ) {
      throw new BadRequestException('菜单只能关联资源的查看权限')
    }
    return this.updateResources(
      id,
      {
        resourceIds: [...new Set(permissions.map((permission) => permission.resourceId))],
        expectedUpdatedAt: payload.expectedUpdatedAt,
      },
      actorUserId,
    )
  }

  remove(id: number, actorUserId?: number) {
    return runSerializable(this.prisma, async (tx) => {
      const menu = await this.findOne(tx, id)
      if (menu.isBuiltIn) {
        throw new BadRequestException('内置菜单不允许删除')
      }
      if ((await tx.menu.count({ where: { parentId: id } })) > 0) {
        throw new BadRequestException('存在子菜单，无法删除')
      }
      await tx.menu.delete({ where: { id } })
      await this.audit.record(
        { action: 'SYSTEM_MENU_DELETED', actorUserId, entityType: 'Menu', entityId: id },
        tx,
      )
      return { id }
    })
  }

  private async findOne(client: PrismaService | Prisma.TransactionClient, id: number) {
    const menu = await client.menu.findUnique({ where: { id }, include: menuConfigurationInclude })
    if (!menu) {
      throw new NotFoundException('菜单不存在')
    }
    return menu
  }

  private async findSerialized(client: Prisma.TransactionClient, id: number) {
    const menu = await this.findOne(client, id)
    return serializeMenu(menu)
  }

  private async ensureParentExists(client: Prisma.TransactionClient, parentId: number | null) {
    if (parentId !== null) {
      const parent = await this.findOne(client, parentId)
      if (parent.menuType === 'menu') {
        throw new BadRequestException('父级必须是导航分组或目录菜单')
      }
    }
  }

  private async ensureSafeParent(
    client: Prisma.TransactionClient,
    id: number,
    parentId: number | null,
  ) {
    if (parentId === null) {
      return
    }
    if (parentId === id) {
      throw new BadRequestException('父级菜单不能选择自身')
    }
    const parent = await this.findOne(client, parentId)
    if (parent.menuType === 'menu') {
      throw new BadRequestException('父级必须是导航分组或目录菜单')
    }
    const parentById = new Map(
      (await client.menu.findMany({ select: { id: true, parentId: true } })).map((menu) => [
        menu.id,
        menu.parentId,
      ]),
    )
    let cursor: number | null | undefined = parentId
    while (cursor !== null && cursor !== undefined) {
      if (cursor === id) {
        throw new BadRequestException('父级菜单不能选择自身或子菜单')
      }
      cursor = parentById.get(cursor)
    }
  }

  private async ensureUnique(
    client: Prisma.TransactionClient,
    parentId: number | null,
    name: string,
    path: string | null,
    routeName: string,
    excludeId?: number,
  ) {
    const conflict = await client.menu.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [{ routeName }, { parentId, name }, ...(path === null ? [] : [{ parentId, path }])],
      },
    })
    if (conflict) {
      throw new ConflictException('菜单标识、路径或路由名已存在')
    }
  }
}

async function replaceResources(
  tx: Prisma.TransactionClient,
  menuId: number,
  menuType: string,
  resourceIds: number[],
) {
  if (menuType === 'group' && resourceIds.length > 0) {
    throw new BadRequestException('导航分组不能关联资源')
  }
  const resources = await tx.resource.findMany({
    where: { id: { in: resourceIds } },
    select: { id: true, permissions: { where: { action: 'view' }, select: { id: true } } },
  })
  if (
    resources.length !== resourceIds.length ||
    resources.some((resource) => resource.permissions.length !== 1)
  ) {
    throw new BadRequestException('存在无效资源或资源缺少唯一查看权限')
  }
  await tx.menuResource.deleteMany({ where: { menuId } })
  await tx.menuPermission.deleteMany({ where: { menuId } })
  if (resourceIds.length === 0) {
    return
  }
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]))
  await tx.menuResource.createMany({
    data: resourceIds.map((resourceId, sort) => ({ menuId, resourceId, sort })),
    skipDuplicates: true,
  })
  await tx.menuPermission.createMany({
    data: resourceIds.map((resourceId) => ({
      menuId,
      permissionId: resourceById.get(resourceId)!.permissions[0]!.id,
    })),
    skipDuplicates: true,
  })
}

function serializeMenu(menu: Prisma.MenuGetPayload<{ include: typeof menuConfigurationInclude }>) {
  return {
    id: menu.id,
    parentId: menu.parentId,
    name: menu.name,
    title: menu.title,
    icon: menu.icon,
    path: menu.path,
    routeName: menu.routeName,
    menuType: menu.menuType,
    sort: menu.sort,
    status: menu.status,
    visible: menu.visible,
    isBuiltIn: menu.isBuiltIn,
    permissions: menu.menuPermissions.map(({ permission }) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
    })),
    resources: menu.menuResources.map(({ resource }) => ({
      id: resource.id,
      key: resource.key,
      name: resource.name,
      module: resource.module,
      status: resource.status,
    })),
    children: [],
    createdAt: menu.createdAt.toISOString(),
    updatedAt: menu.updatedAt.toISOString(),
  }
}

function assertBuiltInPayloadUnchanged(
  current: Prisma.MenuGetPayload<{ include: typeof menuConfigurationInclude }>,
  payload: UpdateSystemMenuPayload,
) {
  const requestedBuiltIn = (payload as UpdateSystemMenuPayload & { isBuiltIn?: boolean }).isBuiltIn
  const structureChanged =
    normalizeNullableId(payload.parentId) !== current.parentId ||
    normalizeOptionalText(payload.name) !== current.name ||
    normalizePath(payload.path) !== current.path ||
    normalizeOptionalText(payload.routeName) !== current.routeName ||
    payload.menuType !== current.menuType ||
    (requestedBuiltIn !== undefined && requestedBuiltIn !== current.isBuiltIn)

  if (structureChanged) {
    throw new BadRequestException('内置菜单的结构和资源关联由系统配置维护')
  }
  if (payload.resourceIds !== undefined) {
    assertUnchangedResourceIds(current, normalizeIds(payload.resourceIds))
  }
}

function assertUnchangedResourceIds(
  current: Prisma.MenuGetPayload<{ include: typeof menuConfigurationInclude }>,
  requestedResourceIds: number[],
) {
  const currentResourceIds = current.menuResources.map((relation) => relation.resourceId)
  if (
    currentResourceIds.length !== requestedResourceIds.length ||
    currentResourceIds.some((resourceId, index) => resourceId !== requestedResourceIds[index])
  ) {
    throw new BadRequestException('内置菜单的结构和资源关联由系统配置维护')
  }
}

function normalizeMenuPayload(payload: CreateSystemMenuPayload | UpdateSystemMenuPayload) {
  const parentId = normalizeNullableId(payload.parentId)
  const name = normalizeRequiredText(payload.name, '菜单标识不能为空')
  const path = normalizePath(payload.path)
  const routeName = normalizeRequiredText(payload.routeName, '路由名不能为空')
  assertMenuNavigation(payload.menuType, path, routeName)
  return {
    parentId,
    name,
    path,
    routeName,
    data: {
      parentId,
      name,
      title: normalizeRequiredText(payload.title, '菜单标题不能为空'),
      icon: payload.icon === undefined ? undefined : (normalizeOptionalText(payload.icon) ?? null),
      path,
      routeName,
      menuType: payload.menuType,
      sort: Number.isInteger(Number(payload.sort)) ? Number(payload.sort) : 0,
      status: payload.status,
      visible: Boolean(payload.visible),
    },
  }
}

function normalizeOptionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function normalizeRequiredText(value: unknown, message: string) {
  const valueString = normalizeOptionalText(value)
  if (!valueString) {
    throw new BadRequestException(message)
  }
  return valueString
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

function normalizeNullableId(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeIds(values: number[]) {
  return [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value > 0))]
}
