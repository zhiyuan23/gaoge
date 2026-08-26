import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import { AuditLogService } from '@/common/audit/audit-log.service'
import { PrismaService } from '@/common/prisma/prisma.service'

import { assertExpectedUpdatedAt, runSerializable } from '../system-transaction'

import type { CreateSystemResourceDto } from './dto/create-system-resource.dto'
import type { CreateSystemResourcePermissionDto } from './dto/create-system-resource-permission.dto'
import type { SystemResourceListDto } from './dto/system-resource-list.dto'
import type { UpdateSystemResourceDto } from './dto/update-system-resource.dto'
import type { UpdateSystemResourceStatusDto } from './dto/update-system-resource-status.dto'

const resourceInclude = {
  permissions: {
    orderBy: [{ action: 'asc' as const }, { id: 'asc' as const }],
    include: {
      rolePermissions: {
        include: { role: { select: { id: true, code: true, name: true } } },
      },
    },
  },
  menuResources: {
    orderBy: { sort: 'asc' as const },
    include: { menu: { select: { id: true, title: true, routeName: true } } },
  },
} satisfies Prisma.ResourceInclude

@Injectable()
export class SystemResourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(query: SystemResourceListDto = {}) {
    const keyword = normalizeOptionalText(query.keyword)
    const list = await this.prisma.resource.findMany({
      where: {
        ...(keyword
          ? {
              OR: [
                { key: { contains: keyword, mode: 'insensitive' as const } },
                { name: { contains: keyword, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(query.module ? { module: query.module.trim() } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: resourceInclude,
      orderBy: [{ module: 'asc' }, { sort: 'asc' }, { id: 'asc' }],
    })
    return list.map(serializeResource)
  }

  async create(payload: CreateSystemResourceDto, actorUserId?: number) {
    const key = normalizeResourceKey(payload.key)
    const module = normalizeRequiredText(payload.module, '资源模块不能为空')
    if (!key.startsWith(`${module}.`)) {
      throw new BadRequestException('资源 key 必须以资源模块开头')
    }

    return runSerializable(this.prisma, async (tx) => {
      const duplicated = await tx.resource.findUnique({ where: { key } })
      if (duplicated) {
        throw new ConflictException('资源 key 已存在')
      }
      const resourceSegment = key.slice(key.indexOf('.') + 1)
      const resource = await tx.resource.create({
        data: {
          key,
          name: normalizeRequiredText(payload.name, '资源名称不能为空'),
          module,
          description: normalizeOptionalText(payload.description),
          sort: normalizeInteger(payload.sort, 0),
        },
      })
      await tx.permission.create({
        data: {
          code: `${key}.view`,
          name: normalizeOptionalText(payload.viewName) ?? `查看${resource.name}`,
          module: key.split('.')[0]!,
          resource: resourceSegment,
          action: 'view',
          description: normalizeOptionalText(payload.viewDescription) ?? `访问${resource.name}`,
          status: 'active',
          resourceId: resource.id,
        },
      })
      await this.audit.record(
        {
          action: 'SYSTEM_RESOURCE_CREATED',
          actorUserId,
          entityType: 'Resource',
          entityId: resource.id,
          metadata: { key },
        },
        tx,
      )
      return this.findOneWithClient(tx, resource.id)
    })
  }

  async update(id: number, payload: UpdateSystemResourceDto, actorUserId?: number) {
    return runSerializable(this.prisma, async (tx) => {
      const current = await this.findOneOrThrow(tx, id)
      assertExpectedUpdatedAt(current.updatedAt, payload.expectedUpdatedAt)
      const module = normalizeRequiredText(payload.module, '资源模块不能为空')
      if (!current.key.startsWith(`${module}.`)) {
        throw new BadRequestException('资源模块必须与稳定资源 key 保持一致')
      }
      await tx.resource.update({
        where: { id },
        data: {
          name: normalizeRequiredText(payload.name, '资源名称不能为空'),
          module,
          description: normalizeOptionalText(payload.description),
          sort: normalizeInteger(payload.sort, 0),
        },
      })
      await this.audit.record(
        {
          action: 'SYSTEM_RESOURCE_UPDATED',
          actorUserId,
          entityType: 'Resource',
          entityId: id,
        },
        tx,
      )
      return this.findOneWithClient(tx, id)
    })
  }

  async updateStatus(id: number, payload: UpdateSystemResourceStatusDto, actorUserId?: number) {
    return runSerializable(this.prisma, async (tx) => {
      const current = await this.findOneOrThrow(tx, id)
      assertExpectedUpdatedAt(current.updatedAt, payload.expectedUpdatedAt)
      if (current.isBuiltIn && payload.status === 'inactive') {
        throw new BadRequestException('内置资源不允许停用')
      }
      await tx.resource.update({ where: { id }, data: { status: payload.status } })
      await this.audit.record(
        {
          action: 'SYSTEM_RESOURCE_STATUS_CHANGED',
          actorUserId,
          entityType: 'Resource',
          entityId: id,
          metadata: { status: payload.status },
        },
        tx,
      )
      return this.findOneWithClient(tx, id)
    })
  }

  async createPermission(
    id: number,
    payload: CreateSystemResourcePermissionDto,
    actorUserId?: number,
  ) {
    const action = normalizeAction(payload.action)
    if (action === 'view') {
      throw new BadRequestException('查看权限随资源自动创建')
    }

    return runSerializable(this.prisma, async (tx) => {
      const resource = await this.findOneOrThrow(tx, id)
      const [legacyModule, ...legacyResourceParts] = resource.key.split('.')
      const code = `${resource.key}.${action}`
      const existing = await tx.permission.findUnique({ where: { code } })
      if (existing) {
        throw new ConflictException('权限码已存在')
      }
      const permission = await tx.permission.create({
        data: {
          code,
          name: normalizeRequiredText(payload.name, '权限名称不能为空'),
          module: legacyModule!,
          resource: legacyResourceParts.join('.'),
          action,
          description: normalizeOptionalText(payload.description),
          status: payload.status,
          resourceId: resource.id,
        },
      })
      await this.audit.record(
        {
          action: 'SYSTEM_PERMISSION_CREATED',
          actorUserId,
          entityType: 'Permission',
          entityId: permission.id,
          metadata: { code, resourceId: resource.id },
        },
        tx,
      )
      return permission
    })
  }

  async remove(id: number, actorUserId?: number) {
    return runSerializable(this.prisma, async (tx) => {
      const resource = await this.findOneOrThrow(tx, id)
      if (resource.isBuiltIn) {
        throw new BadRequestException('内置资源不允许删除')
      }
      const [menuCount, roleCount] = await Promise.all([
        tx.menuResource.count({ where: { resourceId: id } }),
        tx.rolePermission.count({ where: { permission: { resourceId: id } } }),
      ])
      if (menuCount > 0 || roleCount > 0) {
        throw new ConflictException(
          `RBAC_RESOURCE_IN_USE: menu=${menuCount}, rolePermission=${roleCount}`,
        )
      }
      await tx.permission.deleteMany({ where: { resourceId: id } })
      await tx.resource.delete({ where: { id } })
      await this.audit.record(
        {
          action: 'SYSTEM_RESOURCE_DELETED',
          actorUserId,
          entityType: 'Resource',
          entityId: id,
          metadata: { key: resource.key },
        },
        tx,
      )
      return { id }
    })
  }

  private async findOneOrThrow(client: Prisma.TransactionClient | PrismaService, id: number) {
    const resource = await client.resource.findUnique({ where: { id } })
    if (!resource) {
      throw new NotFoundException('资源不存在')
    }
    return resource
  }

  private async findOneWithClient(client: Prisma.TransactionClient, id: number) {
    const resource = await client.resource.findUnique({ where: { id }, include: resourceInclude })
    if (!resource) {
      throw new NotFoundException('资源不存在')
    }
    return serializeResource(resource)
  }
}

function serializeResource(
  resource: Prisma.ResourceGetPayload<{ include: typeof resourceInclude }>,
) {
  const roleById = new Map<number, { id: number; code: string; name: string }>()
  for (const permission of resource.permissions) {
    for (const relation of permission.rolePermissions) {
      roleById.set(relation.role.id, relation.role)
    }
  }
  return {
    id: resource.id,
    key: resource.key,
    name: resource.name,
    module: resource.module,
    description: resource.description,
    status: resource.status,
    sort: resource.sort,
    isBuiltIn: resource.isBuiltIn,
    permissions: resource.permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      module: permission.module,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      status: permission.status,
      isBuiltIn: permission.isBuiltIn,
      resourceId: resource.id,
      resourceDefinition: {
        id: resource.id,
        key: resource.key,
        name: resource.name,
        status: resource.status,
      },
      roles: permission.rolePermissions.map((relation) => relation.role),
      createdAt: permission.createdAt.toISOString(),
      updatedAt: permission.updatedAt.toISOString(),
    })),
    menus: resource.menuResources.map((relation) => relation.menu),
    menuCount: resource.menuResources.length,
    roles: [...roleById.values()],
    roleCount: roleById.size,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  }
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

function normalizeResourceKey(value: unknown) {
  const key = normalizeRequiredText(value, '资源 key 不能为空')
  if (!/^[a-z][A-Za-z0-9-]*\.[a-z][A-Za-z0-9-]*$/.test(key)) {
    throw new BadRequestException('资源 key 必须为 module.resource 格式')
  }
  return key
}

function normalizeAction(value: unknown) {
  const action = normalizeRequiredText(value, '操作标识不能为空')
  if (!/^[a-z][A-Za-z0-9-]*$/.test(action)) {
    throw new BadRequestException('操作标识格式不正确')
  }
  return action
}
