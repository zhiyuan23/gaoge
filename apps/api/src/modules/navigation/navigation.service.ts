import { Injectable } from '@nestjs/common'

import type { AdminNavigationNode, SystemMenuType } from '@gaoge/shared-types'

import { PrismaService } from '@/common/prisma/prisma.service'
import { PermissionResolverService } from '@/modules/system/rbac/permission-resolver.service'

type MenuRecord = {
  id: number
  parentId: number | null
  title: string
  icon: string | null
  path: string | null
  routeName: string
  menuType: SystemMenuType
  sort: number
  menuResources: {
    resource: {
      status: string
      permissions: { code: string }[]
    }
  }[]
}

type LegacyNavigationNode = {
  name: string
  meta: {
    title: string
    icon?: string
  }
  children: LegacyNavigationNode[]
}

type ProjectedNavigationNode = AdminNavigationNode & LegacyNavigationNode

@Injectable()
export class NavigationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionResolver: PermissionResolverService,
  ) {}

  async getVisibleMenus(userId: number): Promise<AdminNavigationNode[]> {
    const [authorization, menus] = await Promise.all([
      this.permissionResolver.resolve(userId),
      this.prisma.menu.findMany({
        where: { status: 'active', visible: true },
        select: {
          id: true,
          parentId: true,
          title: true,
          icon: true,
          path: true,
          routeName: true,
          menuType: true,
          sort: true,
          menuResources: {
            orderBy: { sort: 'asc' },
            select: {
              resource: {
                select: {
                  status: true,
                  permissions: {
                    where: { action: 'view', status: 'active' },
                    select: { code: true },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      }),
    ])
    const permitted = new Set(authorization.permissions)
    const menuById = new Map(menus.map((menu) => [menu.id, menu as MenuRecord]))
    const childrenByParentId = new Map<number | null, MenuRecord[]>()
    for (const menu of menuById.values()) {
      const children = childrenByParentId.get(menu.parentId) ?? []
      children.push(menu)
      childrenByParentId.set(menu.parentId, children)
    }
    for (const children of childrenByParentId.values()) {
      children.sort((left, right) => left.sort - right.sort || left.id - right.id)
    }

    const project = (menu: MenuRecord): ProjectedNavigationNode | null => {
      const children = (childrenByParentId.get(menu.id) ?? [])
        .map(project)
        .filter((child): child is ProjectedNavigationNode => child !== null)
      const resourceVisible =
        menu.menuResources.length === 0 ||
        menu.menuResources.some(
          ({ resource }) =>
            resource.status === 'active' &&
            resource.permissions.some(({ code }) => permitted.has(code)),
        )
      if ((menu.menuType === 'catalog' || menu.menuType === 'group') && children.length === 0) {
        return null
      }
      if (menu.menuType === 'menu' && !resourceVisible) {
        return null
      }
      return {
        routeName: menu.routeName,
        type: menu.menuType,
        path: menu.path,
        title: menu.title,
        icon: menu.icon,
        name: menu.routeName,
        meta: {
          title: menu.title,
          icon: menu.icon ?? undefined,
        },
        children,
      }
    }

    return (childrenByParentId.get(null) ?? [])
      .map(project)
      .filter((menu): menu is ProjectedNavigationNode => menu !== null)
  }
}
