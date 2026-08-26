import { BadRequestException } from '@nestjs/common'

export type ResourcePermissionPolicyRecord = {
  id: number
  code: string
  action: string
  status: string
  resourceId: number
  resourceDefinition: {
    id: number
    status: string
  }
}

export function normalizeRequestedPermissionIds(
  permissions: ResourcePermissionPolicyRecord[],
  requestedPermissionIds: number[],
) {
  const normalizedIds = [...new Set(requestedPermissionIds.map(Number).filter(Number.isInteger))]
  const permissionById = new Map(permissions.map((permission) => [permission.id, permission]))
  const selected = normalizedIds.map((id) => permissionById.get(id))

  if (selected.some((permission) => !permission)) {
    throw new BadRequestException('存在无效权限')
  }

  const selectedPermissions = selected as ResourcePermissionPolicyRecord[]
  for (const permission of selectedPermissions) {
    if (permission.status !== 'active' || permission.resourceDefinition.status !== 'active') {
      throw new BadRequestException('停用的资源或权限不能授权')
    }
  }

  const viewByResourceId = new Map(
    permissions
      .filter(
        (permission) =>
          permission.action === 'view' &&
          permission.status === 'active' &&
          permission.resourceDefinition.status === 'active',
      )
      .map((permission) => [permission.resourceId, permission]),
  )

  const result = new Set(normalizedIds)
  for (const permission of selectedPermissions) {
    if (permission.action === 'view') {
      continue
    }

    const viewPermission = viewByResourceId.get(permission.resourceId)
    if (!viewPermission) {
      throw new BadRequestException(`权限 ${permission.code} 缺少有效查看权限`)
    }
    result.add(viewPermission.id)
  }

  return [...result].sort((left, right) => left - right)
}

export function filterEffectivePermissions(permissions: ResourcePermissionPolicyRecord[]) {
  const activeViewResourceIds = new Set(
    permissions
      .filter(
        (permission) =>
          permission.action === 'view' &&
          permission.status === 'active' &&
          permission.resourceDefinition.status === 'active',
      )
      .map((permission) => permission.resourceId),
  )

  return permissions.filter(
    (permission) =>
      permission.status === 'active' &&
      permission.resourceDefinition.status === 'active' &&
      activeViewResourceIds.has(permission.resourceId),
  )
}
