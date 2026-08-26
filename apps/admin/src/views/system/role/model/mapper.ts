import type { CreateSystemRolePayload, UpdateSystemRolePayload } from '@gaoge/shared-types'

import type { SystemRoleFormModel, SystemRoleSearch } from './types'

export function buildSystemRoleSearchParams(search: SystemRoleSearch) {
  return {
    keyword: search.keyword.trim() || undefined,
    status: search.status || undefined,
  }
}

export function buildSystemRoleCreatePayload(model: SystemRoleFormModel): CreateSystemRolePayload {
  return {
    code: model.code.trim(),
    name: model.name.trim(),
    description: model.description.trim() || undefined,
    status: model.status,
    sort: Number(model.sort) || 0,
  }
}

export function buildSystemRoleUpdatePayload(
  model: SystemRoleFormModel,
): Omit<UpdateSystemRolePayload, 'expectedUpdatedAt'> {
  return {
    name: model.name.trim(),
    description: model.description.trim() || undefined,
    status: model.status,
    sort: Number(model.sort) || 0,
  }
}
