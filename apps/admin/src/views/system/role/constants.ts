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
