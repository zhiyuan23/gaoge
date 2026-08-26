import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import type {
  CreateSystemPermissionPayload,
  SystemPermissionListParams,
  UpdateSystemPermissionPayload,
} from '@gaoge/shared-types'

import { AuditLogService } from '@/common/audit/audit-log.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { RbacSyncService } from '@/modules/system/rbac/rbac-sync.service'

import { assertExpectedUpdatedAt, runSerializable } from '../system-transaction'

@Injectable()
export class SystemPermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacSyncService: RbacSyncService,
    private readonly audit: AuditLogService,
  ) {}

  async findAll(params: SystemPermissionListParams = {}) {
    const keyword = normalizeOptionalText(params.keyword)
    const module = normalizeOptionalText(params.module)
    const status = normalizeOptionalText(params.status)

    const list = await this.prisma.permission.findMany({
      where: {
        ...(keyword
          ? {
              OR: [
                { code: { contains: keyword, mode: 'insensitive' } },
                { name: { contains: keyword, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(module ? { module } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
      include: { resourceDefinition: true },
    })

    return list.map(serializePermission)
  }

  async findGrouped() {
    const list = await this.findAll()
    const groups = Object.values(
      list.reduce<Record<string, { module: string; permissions: typeof list }>>((acc, item) => {
        const current = acc[item.module] ?? {
          module: item.module,
          permissions: [],
        }
        current.permissions.push(item)
        acc[item.module] = current
        return acc
      }, {}),
    )

    return { groups }
  }

  async create(payload: CreateSystemPermissionPayload, actorUserId?: number) {
    const code = normalizePermissionCode(payload.code)
    const existing = await this.prisma.permission.findUnique({
      where: { code },
    })
    if (existing) {
      throw new ConflictException('权限码已存在')
    }

    const [module, resource, action] = code.split('.') as [string, string, string]
    return runSerializable(this.prisma, async (tx) => {
      const resourceDefinition = await tx.resource.findUnique({
        where: { key: `${module}.${resource}` },
      })
      if (!resourceDefinition) {
        throw new BadRequestException('权限必须归属于已存在资源')
      }
      const created = await tx.permission.create({
        data: {
          code,
          name: normalizeRequiredText(payload.name, '权限名称不能为空'),
          module,
          resource,
          action,
          resourceId: resourceDefinition.id,
          description: normalizeOptionalText(payload.description),
          status: payload.status,
          isBuiltIn: false,
        },
        include: { resourceDefinition: true },
      })
      await this.audit.record(
        {
          action: 'SYSTEM_PERMISSION_CREATED',
          actorUserId,
          entityType: 'Permission',
          entityId: created.id,
          metadata: { code },
        },
        tx,
      )
      return serializePermission(created)
    })
  }

  async update(id: number, payload: UpdateSystemPermissionPayload, actorUserId?: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    })
    if (!permission) {
      throw new NotFoundException('权限不存在')
    }

    return runSerializable(this.prisma, async (tx) => {
      const current = await tx.permission.findUnique({ where: { id } })
      if (!current) {
        throw new NotFoundException('权限不存在')
      }
      assertExpectedUpdatedAt(current.updatedAt, payload.expectedUpdatedAt)
      if (current.isBuiltIn && payload.status === 'inactive') {
        throw new BadRequestException('内置权限不允许停用')
      }
      const updated = await tx.permission.update({
        where: { id },
        data: {
          name: normalizeRequiredText(payload.name, '权限名称不能为空'),
          description: normalizeOptionalText(payload.description),
          status: payload.status,
        },
        include: { resourceDefinition: true },
      })
      await this.audit.record(
        {
          action: 'SYSTEM_PERMISSION_UPDATED',
          actorUserId,
          entityType: 'Permission',
          entityId: id,
          metadata: { status: payload.status },
        },
        tx,
      )
      return serializePermission(updated)
    })
  }

  async remove(id: number, actorUserId?: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    })
    if (!permission) {
      throw new NotFoundException('权限不存在')
    }
    if (permission.isBuiltIn) {
      throw new BadRequestException('内置权限不允许删除')
    }
    if (permission.action === 'view') {
      throw new BadRequestException('资源查看权限不允许单独删除')
    }

    await runSerializable(this.prisma, async (tx) => {
      const [roleBindingCount, menuBindingCount] = await Promise.all([
        tx.rolePermission.count({ where: { permissionId: id } }),
        tx.menuPermission.count({ where: { permissionId: id } }),
      ])
      if (roleBindingCount > 0) {
        throw new BadRequestException('权限已绑定角色，无法删除')
      }
      if (menuBindingCount > 0) {
        throw new BadRequestException('权限已绑定菜单，无法删除')
      }
      await tx.permission.delete({ where: { id } })
      await this.audit.record(
        {
          action: 'SYSTEM_PERMISSION_DELETED',
          actorUserId,
          entityType: 'Permission',
          entityId: id,
          metadata: { code: permission.code },
        },
        tx,
      )
    })

    return { id }
  }

  async syncBuiltIns(actorUserId?: number) {
    const result = await this.rbacSyncService.syncBuiltIns()
    await this.audit.record({
      action: 'SYSTEM_PERMISSION_BUILTINS_SYNCED',
      actorUserId,
      metadata: result,
    })
    return result
  }
}

function serializePermission(item: {
  id: number
  code: string
  name: string
  module: string
  resource: string
  action: string
  description: string | null
  status: string
  isBuiltIn: boolean
  createdAt: Date
  updatedAt: Date
  resourceDefinition: {
    id: number
    key: string
    name: string
    status: string
  }
}) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    module: item.module,
    resource: item.resource,
    action: item.action,
    description: item.description,
    status: item.status,
    isBuiltIn: item.isBuiltIn,
    resourceId: item.resourceDefinition.id,
    resourceDefinition: item.resourceDefinition,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
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

function normalizePermissionCode(value: unknown) {
  const code = normalizeRequiredText(value, '权限码不能为空')
  const parts = code.split('.')
  const isValid = parts.length === 3 && parts.every((part) => /^[a-z][A-Za-z0-9-]*$/.test(part))

  if (!isValid) {
    throw new BadRequestException('权限码必须为 module.resource.action 格式')
  }

  return code
}
