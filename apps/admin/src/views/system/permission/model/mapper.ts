import type {
  CreateSystemPermissionPayload,
  UpdateSystemPermissionPayload,
} from '@gaoge/shared-types'

import type { SystemPermissionFormModel, SystemPermissionSearch } from './types'

export function buildSystemPermissionSearchParams(search: SystemPermissionSearch) {
  return {
    keyword: search.keyword.trim() || undefined,
    module: search.module || undefined,
    status: search.status || undefined,
  }
}

export function buildSystemPermissionCreatePayload(
  model: SystemPermissionFormModel,
): CreateSystemPermissionPayload {
  return {
    code: model.code.trim(),
    name: model.name.trim(),
    description: model.description.trim() || undefined,
    status: model.status,
  }
}

export function buildSystemPermissionUpdatePayload(
  model: SystemPermissionFormModel,
): Omit<UpdateSystemPermissionPayload, 'expectedUpdatedAt'> {
  return {
    name: model.name.trim(),
    description: model.description.trim() || undefined,
    status: model.status,
  }
}
