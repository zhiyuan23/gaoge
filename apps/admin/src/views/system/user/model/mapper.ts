import type {
  CreateSystemUserPayload,
  SystemUserListParams,
  UpdateSystemUserPayload,
} from '@gaoge/shared-types'

import type { SystemUserFormModel, SystemUserSearch } from './types'

export function buildSystemUserSearchParams(search: SystemUserSearch): SystemUserListParams {
  return {
    keyword: search.keyword.trim() || undefined,
    roleId: search.roleId || undefined,
    status: search.status || undefined,
  }
}

export function buildSystemUserCreatePayload(model: SystemUserFormModel): CreateSystemUserPayload {
  return {
    account: model.account.trim(),
    password: model.password,
    nickname: model.nickname.trim(),
    avatarUrl: model.avatarUrl.trim() || undefined,
    roleIds: model.roleIds,
    status: model.status,
  }
}

export function buildSystemUserUpdatePayload(model: SystemUserFormModel): UpdateSystemUserPayload {
  return {
    nickname: model.nickname.trim(),
    avatarUrl: model.avatarUrl.trim() || undefined,
    roleIds: model.roleIds,
  }
}
