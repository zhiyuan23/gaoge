import { BadRequestException } from '@nestjs/common'

import {
  filterEffectivePermissions,
  normalizeRequestedPermissionIds,
  type ResourcePermissionPolicyRecord,
} from './resource-permission-policy'

const permission = (
  id: number,
  resourceId: number,
  action: string,
  status = 'active',
  resourceStatus = 'active',
): ResourcePermissionPolicyRecord => ({
  id,
  code: `module.resource${resourceId}.${action}`,
  action,
  status,
  resourceId,
  resourceDefinition: { id: resourceId, status: resourceStatus },
})

describe('resource permission policy', () => {
  const catalog = [
    permission(1, 10, 'view'),
    permission(2, 10, 'update'),
    permission(3, 20, 'view', 'inactive'),
    permission(4, 20, 'delete'),
    permission(5, 30, 'view', 'active', 'inactive'),
  ]

  it('automatically includes the active view dependency for non-view permissions', () => {
    expect(normalizeRequestedPermissionIds(catalog, [2])).toEqual([1, 2])
  })

  it('rejects unknown, inactive, or dependency-broken assignments', () => {
    expect(() => normalizeRequestedPermissionIds(catalog, [999])).toThrow(BadRequestException)
    expect(() => normalizeRequestedPermissionIds(catalog, [3])).toThrow(BadRequestException)
    expect(() => normalizeRequestedPermissionIds(catalog, [4])).toThrow(BadRequestException)
    expect(() => normalizeRequestedPermissionIds(catalog, [5])).toThrow(BadRequestException)
  })

  it('filters actions without an effective view and removes inactive resources', () => {
    expect(filterEffectivePermissions([catalog[1]!, catalog[4]!])).toEqual([])
    expect(filterEffectivePermissions([catalog[0]!, catalog[1]!]).map((item) => item.id)).toEqual([
      1, 2,
    ])
  })
})
