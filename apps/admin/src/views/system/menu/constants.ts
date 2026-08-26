import type { SystemMenu } from '@/api/system/menu'
import type { SystemPermission } from '@/api/system/permission'

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

export function formatParentOptions(
  tree: Pick<SystemMenu, 'id' | 'title' | 'children'>[],
  prefix = '',
  excludeIds: Set<number> = new Set(),
): { label: string; value: number }[] {
  const list: { label: string; value: number }[] = []
  for (const node of tree) {
    if (excludeIds.has(node.id)) {
      continue
    }

    list.push({
      label: `${prefix}${node.title}`,
      value: node.id,
    })
    if (node.children?.length) {
      list.push(...formatParentOptions(node.children, `${prefix}${node.title} / `, excludeIds))
    }
  }
  return list
}

export function collectMenuBranchIds(
  tree: Pick<SystemMenu, 'id' | 'children'>[],
  rootId?: number | null,
): Set<number> {
  if (!rootId) {
    return new Set()
  }

  const root = findMenuNode(tree, rootId)
  const ids = new Set<number>()
  if (!root) {
    return ids
  }

  const queue = [root]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    ids.add(current.id)
    queue.push(...(current.children ?? []))
  }

  return ids
}

export function formatMenuTypeLabel(menuType: SystemMenu['menuType']) {
  if (menuType === 'group') {
    return '分组'
  }

  return menuType === 'catalog' ? '目录' : '菜单'
}

export function canDeleteMenu(menu: Pick<SystemMenu, 'isBuiltIn' | 'children'>) {
  return !menu.isBuiltIn && (menu.children?.length ?? 0) === 0
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

function findMenuNode(
  tree: Pick<SystemMenu, 'id' | 'children'>[],
  targetId: number,
): Pick<SystemMenu, 'id' | 'children'> | null {
  for (const node of tree) {
    if (node.id === targetId) {
      return node
    }
    const child = findMenuNode(node.children ?? [], targetId)
    if (child) {
      return child
    }
  }

  return null
}
