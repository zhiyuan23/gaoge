import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/common/prisma/prisma.service'

import {
  BUILT_IN_MENU_DEFINITIONS,
  BUILT_IN_PERMISSION_DEFINITIONS,
  BUILT_IN_ROLE_DEFINITIONS,
  type BuiltInMenuDefinition,
  LEGACY_ROLE_CODE_MAP,
  SUPER_ADMIN_PERMISSION_CODES,
  SYSTEM_VIEWER_PERMISSION_CODES,
} from './builtins'

@Injectable()
export class RbacSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async syncBuiltIns() {
    return this.prisma.$transaction(async (tx: any) => {
      const roles = await Promise.all(
        BUILT_IN_ROLE_DEFINITIONS.map((role) =>
          tx.role.upsert({
            where: { code: role.code },
            update: {
              name: role.name,
              description: role.description,
              status: role.status,
              sort: role.sort,
              isBuiltIn: role.isBuiltIn,
            },
            create: role,
          }),
        ),
      )

      const permissions = await Promise.all(
        BUILT_IN_PERMISSION_DEFINITIONS.map((permission) =>
          tx.permission.upsert({
            where: { code: permission.code },
            update: {
              name: permission.name,
              module: permission.module,
              resource: permission.resource,
              action: permission.action,
              description: permission.description,
              status: permission.status,
              isBuiltIn: permission.isBuiltIn,
            },
            create: permission,
          }),
        ),
      )

      const permissionIdByCode = new Map(permissions.map((item: any) => [item.code, item.id]))
      const menuIdByRouteName = new Map<string, number>()

      for (const menu of BUILT_IN_MENU_DEFINITIONS) {
        await this.upsertMenuTree(tx, menu, null, menuIdByRouteName)
      }

      const roleIdByCode = new Map(roles.map((item: any) => [item.code, item.id]))

      await tx.rolePermission.deleteMany({
        where: {
          roleId: {
            in: roles.map((item: any) => item.id),
          },
        },
      })
      await tx.rolePermission.createMany({
        data: [
          ...SUPER_ADMIN_PERMISSION_CODES.map((code) => ({
            roleId: roleIdByCode.get('super_admin'),
            permissionId: permissionIdByCode.get(code),
          })),
          ...SYSTEM_VIEWER_PERMISSION_CODES.map((code) => ({
            roleId: roleIdByCode.get('system_viewer'),
            permissionId: permissionIdByCode.get(code),
          })),
        ].filter((item) => item.roleId && item.permissionId),
        skipDuplicates: true,
      })

      await tx.menuPermission.deleteMany({
        where: {
          menuId: {
            in: [...menuIdByRouteName.values()],
          },
        },
      })
      await tx.menuPermission.createMany({
        data: this.flattenMenuPermissions(
          BUILT_IN_MENU_DEFINITIONS,
          menuIdByRouteName,
          permissionIdByCode,
        ),
        skipDuplicates: true,
      })

      const legacyUsers = await tx.user.findMany({
        where: {
          account: { not: null },
        },
        select: {
          id: true,
          role: true,
          account: true,
        },
      })

      for (const user of legacyUsers) {
        const roleCode = LEGACY_ROLE_CODE_MAP[user.role]
        if (!roleCode) {
          continue
        }

        const roleId = roleIdByCode.get(roleCode)
        if (!roleId) {
          continue
        }

        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleId,
          },
        })
      }

      return {
        roles: roles.length,
        permissions: permissions.length,
        menus: menuIdByRouteName.size,
      }
    })
  }

  private async upsertMenuTree(
    tx: any,
    menu: BuiltInMenuDefinition,
    parentId: number | null,
    menuIdByRouteName: Map<string, number>,
  ) {
    const savedMenu = await tx.menu.upsert({
      where: {
        routeName: menu.routeName,
      },
      update: {
        parentId,
        name: menu.name,
        title: menu.title,
        icon: menu.icon,
        path: menu.path,
        menuType: menu.menuType,
        sort: menu.sort,
        status: menu.status,
        visible: menu.visible,
        isBuiltIn: menu.isBuiltIn,
      },
      create: {
        parentId,
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
      },
    })

    menuIdByRouteName.set(menu.routeName, savedMenu.id)

    for (const child of menu.children ?? []) {
      await this.upsertMenuTree(tx, child, savedMenu.id, menuIdByRouteName)
    }
  }

  private flattenMenuPermissions(
    menus: BuiltInMenuDefinition[],
    menuIdByRouteName: Map<string, number>,
    permissionIdByCode: Map<string, number>,
  ): { menuId: number; permissionId: number }[] {
    return menus.flatMap((menu) => [
      ...menu.permissionCodes
        .map((code) => ({
          menuId: menuIdByRouteName.get(menu.routeName),
          permissionId: permissionIdByCode.get(code),
        }))
        .filter(
          (item): item is { menuId: number; permissionId: number } =>
            typeof item.menuId === 'number' && typeof item.permissionId === 'number',
        ),
      ...this.flattenMenuPermissions(menu.children ?? [], menuIdByRouteName, permissionIdByCode),
    ])
  }
}
