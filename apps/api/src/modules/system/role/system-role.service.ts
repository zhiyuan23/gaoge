import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import type {
  CreateSystemRolePayload,
  UpdateSystemRolePayload,
  UpdateSystemRolePermissionsPayload,
  UpdateSystemRoleStatusPayload,
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

    return list.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      status: item.status,
      sort: item.sort,
      isBuiltIn: item.isBuiltIn,
      permissionCount: item._count.rolePermissions,
      userCount: item._count.userRoles,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
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
    const permissionIds = normalizeIdList(payload.permissionIds)

    if (role.code === 'super_admin' && permissionIds.length === 0) {
      throw new BadRequestException('超级管理员角色必须保留权限')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      })
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        })
      }
    })

    return this.getPermissions(id)
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
