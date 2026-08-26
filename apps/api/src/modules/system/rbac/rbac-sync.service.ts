import { ConflictException, Injectable } from '@nestjs/common'

import { PrismaService } from '@/common/prisma/prisma.service'

import {
  BUILT_IN_MENU_DEFINITIONS,
  BUILT_IN_PERMISSION_DEFINITIONS,
  BUILT_IN_RESOURCE_DEFINITIONS,
  BUILT_IN_ROLE_DEFINITIONS,
  type BuiltInMenuDefinition,
  DEPRECATED_BUILT_IN_MENU_ROUTE_NAMES,
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

      const resources = await Promise.all(
        BUILT_IN_RESOURCE_DEFINITIONS.map((resource) =>
          tx.resource.upsert({
            where: { key: resource.key },
            update: {
              name: resource.name,
              module: resource.module,
              description: resource.description,
              status: resource.status,
              sort: resource.sort,
              isBuiltIn: resource.isBuiltIn,
            },
            create: resource,
          }),
        ),
      )
      const resourceIdByKey = new Map(resources.map((item: any) => [item.key, item.id]))

      const permissions = await Promise.all(
        BUILT_IN_PERMISSION_DEFINITIONS.map((permission) =>
          tx.permission.upsert({
            where: { code: permission.code },
            update: {
              name: permission.name,
              module: permission.module,
              resource: permission.resource,
              action: permission.action,
              resourceId: resourceIdByKey.get(`${permission.module}.${permission.resource}`),
              description: permission.description,
              status: permission.status,
              isBuiltIn: permission.isBuiltIn,
            },
            create: {
              ...permission,
              resourceId: resourceIdByKey.get(`${permission.module}.${permission.resource}`),
            },
          }),
        ),
      )

      const permissionIdByCode = new Map(permissions.map((item: any) => [item.code, item.id]))
      const menuIdByRouteName = new Map<string, number>()

      for (const menu of BUILT_IN_MENU_DEFINITIONS) {
        await this.upsertMenuTree(tx, menu, null, menuIdByRouteName)
      }

      await tx.menu.updateMany({
        where: { routeName: { in: [...DEPRECATED_BUILT_IN_MENU_ROUTE_NAMES] }, isBuiltIn: true },
        data: { status: 'inactive', visible: false },
      })

      await this.reconcileStaleBuiltIns(tx, [...menuIdByRouteName.keys()])

      const roleIdByCode = new Map(roles.map((item: any) => [item.code, item.id]))

      await tx.rolePermission.deleteMany({
        where: {
          roleId: {
            in: roles.map((item: any) => item.id),
          },
          permissionId: {
            in: permissions.map((item: any) => item.id),
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

      await tx.menuResource.deleteMany({
        where: {
          menuId: {
            in: [...menuIdByRouteName.values()],
          },
        },
      })
      await tx.menuResource.createMany({
        data: this.flattenMenuResources(
          BUILT_IN_MENU_DEFINITIONS,
          menuIdByRouteName,
          resourceIdByKey,
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
        resources: resources.length,
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
        path: menu.path,
        menuType: menu.menuType,
        isBuiltIn: true,
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

  private flattenMenuResources(
    menus: BuiltInMenuDefinition[],
    menuIdByRouteName: Map<string, number>,
    resourceIdByKey: Map<string, number>,
  ): { menuId: number; resourceId: number; sort: number }[] {
    return menus.flatMap((menu) => {
      const resourceKeys = [
        ...new Set(
          menu.permissionCodes
            .filter((code) => code.endsWith('.view'))
            .map((code) => code.slice(0, -'.view'.length)),
        ),
      ]
      return [
        ...resourceKeys
          .map((key, sort) => ({
            menuId: menuIdByRouteName.get(menu.routeName),
            resourceId: resourceIdByKey.get(key),
            sort,
          }))
          .filter(
            (item): item is { menuId: number; resourceId: number; sort: number } =>
              typeof item.menuId === 'number' && typeof item.resourceId === 'number',
          ),
        ...this.flattenMenuResources(menu.children ?? [], menuIdByRouteName, resourceIdByKey),
      ]
    })
  }

  private async reconcileStaleBuiltIns(tx: any, currentMenuRouteNames: string[]) {
    const [staleRoles, staleResources, stalePermissions, staleMenus] = await Promise.all([
      tx.role.findMany({
        where: {
          isBuiltIn: true,
          code: { notIn: BUILT_IN_ROLE_DEFINITIONS.map((item) => item.code) },
        },
        select: { id: true, code: true },
      }),
      tx.resource.findMany({
        where: {
          isBuiltIn: true,
          key: { notIn: BUILT_IN_RESOURCE_DEFINITIONS.map((item) => item.key) },
        },
        select: { id: true, key: true },
      }),
      tx.permission.findMany({
        where: {
          isBuiltIn: true,
          code: { notIn: BUILT_IN_PERMISSION_DEFINITIONS.map((item) => item.code) },
        },
        select: { id: true, code: true, resourceId: true },
      }),
      tx.menu.findMany({
        where: {
          isBuiltIn: true,
          routeName: { notIn: currentMenuRouteNames },
        },
        select: { id: true, parentId: true, routeName: true },
      }),
    ])

    const staleMenuIds = staleMenus.map((item: any) => item.id)
    if (staleMenuIds.length > 0) {
      const customMenu = await tx.menu.findFirst({
        where: {
          isBuiltIn: false,
          parentId: { in: staleMenuIds },
        },
        select: { id: true, routeName: true },
      })
      if (customMenu) {
        throw new ConflictException('自定义菜单仍依赖待清理的内置菜单')
      }
    }

    const staleResourceIds = staleResources.map((item: any) => item.id)
    if (staleResourceIds.length > 0) {
      const [customPermission, customMenuResource] = await Promise.all([
        tx.permission.findFirst({
          where: {
            isBuiltIn: false,
            resourceId: { in: staleResourceIds },
          },
          select: { id: true, code: true },
        }),
        tx.menuResource.findFirst({
          where: {
            resourceId: { in: staleResourceIds },
            menu: { isBuiltIn: false },
          },
          select: { menuId: true, resourceId: true },
        }),
      ])
      if (customPermission) {
        throw new ConflictException('自定义权限仍依赖待清理的内置资源')
      }
      if (customMenuResource) {
        throw new ConflictException('自定义菜单仍依赖待清理的内置资源')
      }
    }

    await this.deleteStaleMenusLeafFirst(tx, staleMenus)

    const stalePermissionIds = stalePermissions.map((item: any) => item.id)
    if (stalePermissionIds.length > 0) {
      await tx.permission.deleteMany({
        where: { id: { in: stalePermissionIds }, isBuiltIn: true },
      })
    }
    if (staleResourceIds.length > 0) {
      await tx.resource.deleteMany({
        where: { id: { in: staleResourceIds }, isBuiltIn: true },
      })
    }

    const staleRoleIds = staleRoles.map((item: any) => item.id)
    if (staleRoleIds.length > 0) {
      await tx.role.deleteMany({
        where: { id: { in: staleRoleIds }, isBuiltIn: true },
      })
    }
  }

  private async deleteStaleMenusLeafFirst(
    tx: any,
    staleMenus: { id: number; parentId: number | null }[],
  ) {
    const remainingMenus = new Map(staleMenus.map((menu) => [menu.id, menu]))

    while (remainingMenus.size > 0) {
      const parentIds = new Set(
        [...remainingMenus.values()]
          .map((menu) => menu.parentId)
          .filter((parentId): parentId is number => typeof parentId === 'number'),
      )
      const leafIds = [...remainingMenus.keys()].filter((id) => !parentIds.has(id))

      if (leafIds.length === 0) {
        throw new ConflictException('待清理的内置菜单树存在循环依赖')
      }

      await tx.menu.deleteMany({
        where: { id: { in: leafIds }, isBuiltIn: true },
      })
      leafIds.forEach((id) => remainingMenus.delete(id))
    }
  }
}
