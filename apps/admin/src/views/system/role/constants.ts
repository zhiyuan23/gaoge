import type { SystemRoleMenuNode, SystemRolePermissionModule } from '@gaoge/shared-types'

import type { SystemPermission } from '@/api/system/permission'
import type { SystemRole } from '@/api/system/role'

export interface PermissionResourceGroup {
  key: string
  label: string
  permissions: SystemPermission[]
  selectedCount: number
}

export interface PermissionModuleGroup {
  key: string
  label: string
  resources: PermissionResourceGroup[]
  selectedCount: number
}

export function formatPermissionModules(
  groups: { module: string; permissions: SystemPermission[] }[],
  selectedIds: number[] = [],
) {
  const selectedIdSet = new Set(selectedIds)

  return groups
    .map<PermissionModuleGroup>((group) => {
      const resources = Object.values(
        group.permissions.reduce<Record<string, PermissionResourceGroup>>((acc, permission) => {
          const resourceKey = `${permission.module}.${permission.resource}`
          const current = acc[resourceKey] ?? {
            key: resourceKey,
            label: permission.resource,
            permissions: [],
            selectedCount: 0,
          }
          current.permissions.push(permission)
          if (selectedIdSet.has(permission.id)) {
            current.selectedCount += 1
          }
          acc[resourceKey] = current
          return acc
        }, {}),
      )

      return {
        key: group.module,
        label: group.module,
        resources,
        selectedCount: resources.reduce((sum, resource) => sum + resource.selectedCount, 0),
      }
    })
    .filter((group) => group.resources.length > 0)
}

export function collectCheckedMenuIds(menuTree: SystemRoleMenuNode[]) {
  const ids: number[] = []

  const visit = (node: SystemRoleMenuNode) => {
    if (node.checked && node.menuType === 'menu' && node.permissionIds.length > 0) {
      ids.push(node.id)
    }
    node.children.forEach(visit)
  }

  menuTree.forEach(visit)

  return ids
}

export function collectCheckedPermissionIds(permissionGroups: SystemRolePermissionModule[]) {
  return permissionGroups.flatMap((group) =>
    group.resources.flatMap((resource) =>
      resource.permissions.filter((item) => item.checked).map((item) => item.id),
    ),
  )
}

export function collectCheckedPermissionIdsByMenu(
  groupsByMenu: Record<number, SystemRolePermissionModule[]>,
): Record<number, number[]> {
  return Object.fromEntries(
    Object.entries(groupsByMenu).map(([menuId, groups]) => [
      Number(menuId),
      collectCheckedPermissionIds(groups),
    ]),
  ) as Record<number, number[]>
}

export function findFirstManageableMenuId(menuTree: SystemRoleMenuNode[]): number | null {
  for (const node of menuTree) {
    if (node.permissionIds.length > 0) {
      return node.id
    }

    const childId = findFirstManageableMenuId(node.children)
    if (childId) {
      return childId
    }
  }

  return null
}

export function findMenuNodeById(
  menuTree: SystemRoleMenuNode[],
  menuId: number | null,
): SystemRoleMenuNode | null {
  if (!menuId) {
    return null
  }

  for (const node of menuTree) {
    if (node.id === menuId) {
      return node
    }

    const child = findMenuNodeById(node.children, menuId)
    if (child) {
      return child
    }
  }

  return null
}

export function createCopiedRoleForm(role: SystemRole) {
  return {
    code: '',
    name: `${role.name}副本`,
    description: role.description ?? '',
    status: role.status,
    sort: role.sort,
  }
}
