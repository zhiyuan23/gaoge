import { Injectable, UnauthorizedException } from '@nestjs/common'

import { PrismaService } from '@/common/prisma/prisma.service'

import {
  filterEffectivePermissions,
  type ResourcePermissionPolicyRecord,
} from './resource-permission-policy'

@Injectable()
export class PermissionResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        account: true,
        openid: true,
        phone: true,
        role: true,
        status: true,
        deletedAt: true,
        userRoles: {
          where: { role: { status: 'active' } },
          select: {
            role: {
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
                        action: true,
                        status: true,
                        resourceId: true,
                        resourceDefinition: {
                          select: { id: true, status: true },
                        },
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

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    const roles = user.userRoles.map((relation) => relation.role)
    const assignedPermissions = roles.flatMap((role) =>
      role.rolePermissions.map((relation) => relation.permission),
    ) as ResourcePermissionPolicyRecord[]
    const superAdminPermissions = roles.some((role) => role.code === 'super_admin')
      ? ((await this.prisma.permission.findMany({
          where: { status: 'active', resourceDefinition: { status: 'active' } },
          select: {
            id: true,
            code: true,
            action: true,
            status: true,
            resourceId: true,
            resourceDefinition: { select: { id: true, status: true } },
          },
        })) as ResourcePermissionPolicyRecord[])
      : []
    const effectivePermissions = filterEffectivePermissions([
      ...assignedPermissions,
      ...superAdminPermissions,
    ])

    return {
      user: {
        id: user.id,
        account: user.account,
        openid: user.openid,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        status: role.status as 'active' | 'inactive',
      })),
      permissions: [...new Set(effectivePermissions.map((permission) => permission.code))].sort(),
    }
  }
}
