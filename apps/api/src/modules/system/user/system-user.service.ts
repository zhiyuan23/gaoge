import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { Prisma } from '@prisma/client'

import type {
  BatchSystemUserRolesPayload,
  SystemUser,
  SystemUserListParams,
  SystemUserPermissionExplanation,
} from '@gaoge/shared-types'

import { hashPassword } from '@/common/auth/password.util'
import { PrismaService } from '@/common/prisma/prisma.service'

import type { CreateSystemUserDto } from './dto/create-system-user.dto'
import type { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto'
import type { UpdateSystemUserDto } from './dto/update-system-user.dto'
import type { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto'

const roleSummarySelect = {
  id: true,
  code: true,
  name: true,
  status: true,
} satisfies Prisma.RoleSelect

const systemUserSelect = {
  id: true,
  account: true,
  nickname: true,
  avatarUrl: true,
  userRoles: {
    select: {
      role: {
        select: roleSummarySelect,
      },
    },
  },
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

const systemUserLookupSelect = {
  ...systemUserSelect,
  deletedAt: true,
} satisfies Prisma.UserSelect

type SystemUserRecord = Prisma.UserGetPayload<{
  select: typeof systemUserSelect
}>

type SystemUserLookupRecord = Prisma.UserGetPayload<{
  select: typeof systemUserLookupSelect
}>

type BackendSystemUserLookupRecord = SystemUserLookupRecord & {
  account: string
}

type RoleSummaryRecord = Prisma.RoleGetPayload<{
  select: typeof roleSummarySelect
}>

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSystemUserDto) {
    const account = normalizeRequiredText(dto.account, '账号不能为空')
    const passwordHash = await hashPassword(normalizeRequiredPassword(dto.password, '密码不能为空'))
    const existingUser = await this.prisma.user.findFirst({
      where: {
        account,
        deletedAt: null,
      },
    })

    if (existingUser) {
      throw new ConflictException('账号已存在')
    }

    const roles = await this.loadRoles(dto.roleIds)

    const createdUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          account,
          passwordHash,
          nickname: normalizeRequiredText(dto.nickname, '昵称不能为空'),
          avatarUrl: normalizeOptionalText(dto.avatarUrl),
          role: deriveLegacyRole(roles),
          status: dto.status,
        },
        select: systemUserSelect,
      })

      await this.replaceUserRoles(tx, user.id, dto.roleIds)

      return user
    })

    return serializeSystemUser(createdUser, roles)
  }

  async findAll(params: SystemUserListParams = {}) {
    const page = normalizePositiveInteger(params.page, 1)
    const pageSize = normalizePositiveInteger(params.pageSize, 15)
    const where = buildSystemUserWhere(params)
    const [list, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: systemUserSelect,
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      list: list.map((item) => serializeSystemUser(item)),
      total,
    }
  }

  async batchUpdateRoles(payload: BatchSystemUserRolesPayload) {
    const userIds = normalizeIdList(payload.userIds, '至少选择一个用户')
    const roles = await this.loadRoles(payload.roleIds)
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
        account: {
          not: null,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        account: true,
        userRoles: {
          select: {
            role: {
              select: roleSummarySelect,
            },
          },
        },
      },
    })

    if (users.length !== userIds.length) {
      throw new NotFoundException('系统用户不存在')
    }

    const nextRoleIdsByUserId = new Map<number, number[]>()
    const legacyRoleByUserId = new Map<number, ReturnType<typeof deriveLegacyRole>>()

    for (const userId of userIds) {
      const user = users.find((item) => item.id === userId)
      if (!user || !user.account) {
        throw new NotFoundException('系统用户不存在')
      }

      const currentRoles = user.userRoles.map((item) => item.role)
      const nextRoles = payload.mode === 'replace' ? roles : mergeRoleSummaries(currentRoles, roles)

      if (user.account === 'admin' && !hasSuperAdminRole(nextRoles)) {
        throw new BadRequestException('默认 admin 账号不允许降级')
      }

      nextRoleIdsByUserId.set(
        user.id,
        nextRoles.map((item) => item.id),
      )
      legacyRoleByUserId.set(user.id, deriveLegacyRole(nextRoles))
    }

    await this.prisma.$transaction(async (tx) => {
      if (payload.mode === 'replace') {
        await tx.userRole.deleteMany({
          where: {
            userId: {
              in: userIds,
            },
          },
        })
      }

      await tx.userRole.createMany({
        data: userIds.flatMap((userId) =>
          (nextRoleIdsByUserId.get(userId) ?? []).map((roleId) => ({
            userId,
            roleId,
          })),
        ),
        skipDuplicates: true,
      })

      for (const userId of userIds) {
        await tx.user.update({
          where: { id: userId },
          data: {
            role: legacyRoleByUserId.get(userId),
          },
        })
      }
    })

    return {
      userIds,
      roleIds: roles.map((item) => item.id),
      mode: payload.mode,
    }
  }

  async getPermissionExplanation(id: number): Promise<SystemUserPermissionExplanation> {
    const user = await this.findOneOrThrow(id)
    const roleIds = user.userRoles.map((item) => item.role.id)
    const roles = await this.prisma.role.findMany({
      where: {
        id: {
          in: roleIds,
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        rolePermissions: {
          select: {
            permission: {
              select: {
                id: true,
                code: true,
                name: true,
                module: true,
                resource: true,
                action: true,
                menuPermissions: {
                  select: {
                    menu: {
                      select: {
                        id: true,
                        title: true,
                        path: true,
                        routeName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const roleOrder = new Map(roleIds.map((roleId, index) => [roleId, index]))
    const sortedRoles = roles.sort(
      (left, right) => (roleOrder.get(left.id) ?? 0) - (roleOrder.get(right.id) ?? 0),
    )
    const menusById = new Map<
      number,
      {
        id: number
        title: string
        path: string
        routeName: string
        viaRoles: Set<string>
      }
    >()
    const permissionsByCode = new Map<
      string,
      {
        id: number
        code: string
        name: string
        module: string
        resource: string
        action: string
        viaRoles: Set<string>
      }
    >()

    const roleExplanation = sortedRoles.map((role) => {
      const permissionList = role.rolePermissions.map((item) => item.permission)
      const menuList = dedupeById(
        permissionList.flatMap((permission) =>
          permission.menuPermissions.map((entry) => ({
            id: entry.menu.id,
            title: entry.menu.title,
            path: entry.menu.path,
            routeName: entry.menu.routeName,
          })),
        ),
      )

      permissionList.forEach((permission) => {
        const existingPermission = permissionsByCode.get(permission.code) ?? {
          id: permission.id,
          code: permission.code,
          name: permission.name,
          module: permission.module,
          resource: permission.resource,
          action: permission.action,
          viaRoles: new Set<string>(),
        }
        existingPermission.viaRoles.add(role.name)
        permissionsByCode.set(permission.code, existingPermission)

        permission.menuPermissions.forEach((entry) => {
          const existingMenu = menusById.get(entry.menu.id) ?? {
            id: entry.menu.id,
            title: entry.menu.title,
            path: entry.menu.path,
            routeName: entry.menu.routeName,
            viaRoles: new Set<string>(),
          }
          existingMenu.viaRoles.add(role.name)
          menusById.set(entry.menu.id, existingMenu)
        })
      })

      return {
        id: role.id,
        code: role.code,
        name: role.name,
        status: role.status as SystemUserPermissionExplanation['roles'][number]['status'],
        menus: menuList,
        permissions: permissionList.map((permission) => ({
          id: permission.id,
          code: permission.code,
          name: permission.name,
          module: permission.module,
          resource: permission.resource,
          action: permission.action,
        })),
      }
    })

    return {
      user: serializeSystemUser(user),
      roles: roleExplanation,
      menus: [...menusById.values()].map((item) => ({
        id: item.id,
        title: item.title,
        path: item.path,
        routeName: item.routeName,
        viaRoles: [...item.viaRoles],
      })),
      permissions: [...permissionsByCode.values()].map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        module: item.module,
        resource: item.resource,
        action: item.action,
        viaRoles: [...item.viaRoles],
      })),
    }
  }

  async update(id: number, dto: UpdateSystemUserDto) {
    const user = await this.findOneOrThrow(id)
    const roles = await this.loadRoles(dto.roleIds)

    if (user.account === 'admin' && !hasSuperAdminRole(roles)) {
      throw new BadRequestException('默认 admin 账号不允许降级')
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id },
        data: {
          nickname: normalizeRequiredText(dto.nickname, '昵称不能为空'),
          avatarUrl: normalizeOptionalText(dto.avatarUrl),
          role: deriveLegacyRole(roles),
        },
        select: systemUserSelect,
      })

      await this.replaceUserRoles(tx, id, dto.roleIds)

      return nextUser
    })

    return serializeSystemUser(updatedUser, roles)
  }

  async updateStatus(id: number, dto: UpdateSystemUserStatusDto) {
    const user = await this.findOneOrThrow(id)
    if (user.account === 'admin' && dto.status === 'inactive') {
      throw new BadRequestException('默认 admin 账号不允许停用')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        status: dto.status,
      },
      select: systemUserSelect,
    })

    return serializeSystemUser(updatedUser)
  }

  async resetPassword(id: number, dto: ResetSystemUserPasswordDto) {
    await this.findOneOrThrow(id)

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(
          normalizeRequiredPassword(dto.newPassword, '密码不能为空'),
        ),
      },
      select: systemUserSelect,
    })

    return serializeSystemUser(updatedUser)
  }

  async remove(id: number) {
    const user = await this.findOneOrThrow(id)
    if (user.account === 'admin') {
      throw new BadRequestException('默认 admin 账号不允许删除')
    }

    const removedUser = await this.prisma.user.update({
      where: { id },
      data: {
        account: buildDeletedAccount(user.account, user.id),
        status: 'inactive',
        deletedAt: new Date(),
      },
      select: systemUserSelect,
    })

    return serializeSystemUser(removedUser)
  }

  private async findOneOrThrow(id: number): Promise<BackendSystemUserLookupRecord> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: systemUserLookupSelect,
    })

    if (!user || user.deletedAt || user.account === null) {
      throw new NotFoundException('系统用户不存在')
    }

    return user as BackendSystemUserLookupRecord
  }

  private async loadRoles(roleIds: number[]) {
    const normalizedRoleIds = normalizeRoleIds(roleIds)

    const roles = await this.prisma.role.findMany({
      where: {
        id: {
          in: normalizedRoleIds,
        },
      },
      select: roleSummarySelect,
    })

    if (roles.length !== normalizedRoleIds.length) {
      throw new BadRequestException('存在无效角色')
    }

    return roles.sort((a, b) => normalizedRoleIds.indexOf(a.id) - normalizedRoleIds.indexOf(b.id))
  }

  private async replaceUserRoles(tx: Prisma.TransactionClient, userId: number, roleIds: number[]) {
    await tx.userRole.deleteMany({
      where: { userId },
    })
    await tx.userRole.createMany({
      data: normalizeRoleIds(roleIds).map((roleId) => ({
        userId,
        roleId,
      })),
      skipDuplicates: true,
    })
  }
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
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

function normalizeRequiredPassword(value: unknown, message: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(message)
  }

  return value
}

function normalizeRoleIds(roleIds: number[]) {
  const normalized = normalizeIdList(roleIds, '至少选择一个角色')
  if (normalized.length === 0) {
    throw new BadRequestException('至少选择一个角色')
  }

  return normalized
}

function normalizeIdList(values: number[], message: string) {
  const normalized = [
    ...new Set((values ?? []).map((item) => Number(item)).filter((item) => item > 0)),
  ]
  if (normalized.length === 0) {
    throw new BadRequestException(message)
  }

  return normalized
}

function buildSystemUserWhere(params: SystemUserListParams) {
  const keyword = normalizeOptionalText(params.keyword)
  const roleId = normalizePositiveInteger(params.roleId, 0)
  const status = normalizeOptionalText(params.status)
  const where: Prisma.UserWhereInput = {
    account: {
      not: null,
    },
    deletedAt: null,
  }

  if (keyword) {
    const keywordFilter = {
      contains: keyword,
      mode: 'insensitive',
    } satisfies Prisma.StringFilter

    where.OR = [{ account: keywordFilter }, { nickname: keywordFilter }]
  }
  if (roleId > 0) {
    where.userRoles = {
      some: {
        roleId,
      },
    }
  }
  if (status) {
    where.status = status
  }

  return where
}

function buildDeletedAccount(account: string | null | undefined, id: number) {
  const normalizedAccount = normalizeOptionalText(account) ?? 'user'
  return `${normalizedAccount}__deleted__${id}`
}

function hasSuperAdminRole(roles: RoleSummaryRecord[]) {
  return roles.some((role) => role.code === 'super_admin')
}

function deriveLegacyRole(roles: RoleSummaryRecord[]) {
  return roles.length === 1 && roles[0]?.code === 'system_viewer' ? 'viewer' : 'admin'
}

function mergeRoleSummaries(currentRoles: RoleSummaryRecord[], appendedRoles: RoleSummaryRecord[]) {
  const merged = new Map<number, RoleSummaryRecord>()

  currentRoles.forEach((role) => {
    merged.set(role.id, role)
  })
  appendedRoles.forEach((role) => {
    merged.set(role.id, role)
  })

  return [...merged.values()]
}

function dedupeById<T extends { id: number }>(items: T[]) {
  const map = new Map<number, T>()

  items.forEach((item) => {
    map.set(item.id, item)
  })

  return [...map.values()]
}

function serializeSystemUser(
  user: SystemUserRecord,
  fallbackRoles?: RoleSummaryRecord[],
): SystemUser {
  return {
    id: user.id,
    account: user.account ?? '',
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    roles: (fallbackRoles ?? user.userRoles?.map((item) => item.role) ?? []) as SystemUser['roles'],
    status: user.status as SystemUser['status'],
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}
