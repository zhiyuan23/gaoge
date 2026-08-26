import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type {
  CreateSystemRolePayload,
  UpdateSystemRolePayload,
  UpdateSystemRolePermissionsPayload,
  UpdateSystemRoleStatusPayload,
} from '@gaoge/shared-types'

import { AuditLogService } from '@/common/audit/audit-log.service'
import { PrismaService } from '@/common/prisma/prisma.service'

import { normalizeRequestedPermissionIds } from '../rbac/resource-permission-policy'
import { assertExpectedUpdatedAt, runSerializable } from '../system-transaction'

@Injectable()
export class SystemRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

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
        rolePermissions: {
          select: {
            permission: {
              select: {
                resourceId: true,
                resourceDefinition: { select: { module: true } },
              },
            },
          },
        },
      },
    })

    return list.map((item) => {
      const resourceIds = new Set(
        item.rolePermissions.map((relation) => relation.permission.resourceId),
      )
      const modules = new Set(
        item.rolePermissions.map((relation) => relation.permission.resourceDefinition.module),
      )
      return {
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        status: item.status,
        sort: item.sort,
        isBuiltIn: item.isBuiltIn,
        permissionCount: item._count.rolePermissions,
        resourceCount: resourceIds.size,
        moduleCount: modules.size,
        userCount: item._count.userRoles,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }
    })
  }

  async create(payload: CreateSystemRolePayload, actorUserId?: number) {
    const code = normalizeRequiredText(payload.code, '角色编码不能为空')
    const existing = await this.prisma.role.findUnique({ where: { code } })
    if (existing) {
      throw new ConflictException('角色编码已存在')
    }

    const roleId = await runSerializable(this.prisma, async (tx) => {
      const role = await tx.role.create({
        data: {
          code,
          name: normalizeRequiredText(payload.name, '角色名称不能为空'),
          description: normalizeOptionalText(payload.description),
          status: payload.status,
          sort: normalizeInteger(payload.sort, 0),
        },
      })
      if (payload.permissionIds !== undefined) {
        await this.replacePermissions(tx, role.id, payload.permissionIds)
      }
      await this.audit.record(
        {
          action: 'SYSTEM_ROLE_CREATED',
          actorUserId,
          entityType: 'Role',
          entityId: role.id,
          metadata: { permissionIds: payload.permissionIds ?? [] },
        },
        tx,
      )
      return role.id
    })
    return (await this.findAll()).find((role) => role.id === roleId)
  }

  async update(id: number, payload: UpdateSystemRolePayload, actorUserId?: number) {
    await runSerializable(this.prisma, async (tx) => {
      const current = await this.findOneOrThrow(id, tx)
      assertExpectedUpdatedAt(current.updatedAt, payload.expectedUpdatedAt)
      if (current.code === 'super_admin' && payload.status === 'inactive') {
        throw new BadRequestException('内置超级管理员角色不允许停用')
      }
      await tx.role.update({
        where: { id },
        data: {
          name: normalizeRequiredText(payload.name, '角色名称不能为空'),
          description: normalizeOptionalText(payload.description),
          status: payload.status,
          sort: normalizeInteger(payload.sort, 0),
        },
      })
      if (payload.permissionIds !== undefined) {
        await this.replacePermissions(tx, id, payload.permissionIds)
      }
      await this.audit.record(
        {
          action: 'SYSTEM_ROLE_UPDATED',
          actorUserId,
          entityType: 'Role',
          entityId: id,
          metadata: payload.permissionIds ? { permissionIds: payload.permissionIds } : undefined,
        },
        tx,
      )
    })
    return (await this.findAll()).find((role) => role.id === id)
  }

  async updateStatus(id: number, payload: UpdateSystemRoleStatusPayload, actorUserId?: number) {
    const role = await this.findOneOrThrow(id)
    if (role.code === 'super_admin' && payload.status === 'inactive') {
      throw new BadRequestException('内置超级管理员角色不允许停用')
    }

    return this.update(
      id,
      {
        name: role.name,
        description: role.description ?? undefined,
        status: payload.status,
        sort: role.sort,
        expectedUpdatedAt: payload.expectedUpdatedAt,
      },
      actorUserId,
    )
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
      include: { resourceDefinition: true },
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
      resourceId: item.resourceId,
      resourceDefinition: {
        id: item.resourceDefinition.id,
        key: item.resourceDefinition.key,
        name: item.resourceDefinition.name,
        status: item.resourceDefinition.status,
      },
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  }

  async updatePermissions(
    id: number,
    payload: UpdateSystemRolePermissionsPayload,
    actorUserId?: number,
  ) {
    const role = await this.findOneOrThrow(id)
    assertExpectedUpdatedAt(role.updatedAt, payload.expectedUpdatedAt)

    if (role.code === 'super_admin' && payload.permissionIds.length === 0) {
      throw new BadRequestException('超级管理员角色必须保留权限')
    }

    await runSerializable(this.prisma, async (tx) => {
      const current = await this.findOneOrThrow(id, tx)
      assertExpectedUpdatedAt(current.updatedAt, payload.expectedUpdatedAt)
      if (current.code === 'super_admin' && payload.permissionIds.length === 0) {
        throw new BadRequestException('超级管理员角色必须保留权限')
      }
      const permissionIds = await this.replacePermissions(tx, id, payload.permissionIds)
      await tx.role.update({ where: { id }, data: { updatedAt: new Date() } })
      await this.audit.record(
        {
          action: 'SYSTEM_ROLE_PERMISSIONS_REPLACED',
          actorUserId,
          entityType: 'Role',
          entityId: id,
          metadata: { requestedPermissionIds: payload.permissionIds, permissionIds },
        },
        tx,
      )
    })

    return this.getPermissions(id)
  }

  async remove(id: number, actorUserId?: number) {
    const role = await this.findOneOrThrow(id)
    if (role.isBuiltIn) {
      throw new BadRequestException('内置角色不允许删除')
    }

    await runSerializable(this.prisma, async (tx) => {
      const current = await this.findOneOrThrow(id, tx)
      if (current.isBuiltIn) {
        throw new BadRequestException('内置角色不允许删除')
      }
      const userCount = await tx.userRole.count({ where: { roleId: id } })
      if (userCount > 0) {
        throw new BadRequestException('角色已绑定用户，无法删除')
      }
      await tx.role.delete({ where: { id } })
      await this.audit.record(
        { action: 'SYSTEM_ROLE_DELETED', actorUserId, entityType: 'Role', entityId: id },
        tx,
      )
    })

    return { id }
  }

  private async findOneOrThrow(
    id: number,
    client: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const role = await client.role.findUnique({
      where: { id },
    })
    if (!role) {
      throw new NotFoundException('角色不存在')
    }

    return role
  }

  private async replacePermissions(
    tx: Prisma.TransactionClient,
    roleId: number,
    requestedPermissionIds: number[],
  ) {
    const permissions = await tx.permission.findMany({
      select: {
        id: true,
        code: true,
        action: true,
        status: true,
        resourceId: true,
        resourceDefinition: { select: { id: true, status: true } },
      },
    })
    const permissionIds = normalizeRequestedPermissionIds(permissions, requestedPermissionIds)
    await tx.rolePermission.deleteMany({ where: { roleId } })
    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      })
    }
    return permissionIds
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
