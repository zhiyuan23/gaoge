import type {
  CreateSystemMenuPayload,
  SystemMenuType,
  UpdateSystemMenuPayload,
  UserStatus,
} from '@gaoge/shared-types'

import type { SystemMenuFormModel } from './types'

interface SystemMenuConfigurationPayloadInput {
  icon: string
  menuType: SystemMenuType
  name: string
  parentId: number | null
  path: string | null
  resourceIds: number[]
  routeName: string
  sort: number
  status: UserStatus
  title: string
  visible: boolean
}

export function normalizeSystemMenuIcon(icon: string): string {
  return icon.trim()
}

function buildSystemMenuConfigurationPayload(
  value: SystemMenuConfigurationPayloadInput,
  icon: string | undefined,
) {
  return {
    icon,
    menuType: value.menuType,
    name: value.name,
    parentId: value.parentId,
    path: value.path,
    resourceIds: value.menuType === 'catalog' ? [] : value.resourceIds,
    routeName: value.routeName,
    sort: value.sort,
    status: value.status,
    title: value.title,
    visible: value.visible,
  }
}

export function buildSystemMenuConfigurationCreatePayload(
  value: SystemMenuConfigurationPayloadInput,
): CreateSystemMenuPayload {
  const icon = normalizeSystemMenuIcon(value.icon)
  return buildSystemMenuConfigurationPayload(value, icon || undefined)
}

export function buildSystemMenuConfigurationUpdatePayload(
  value: SystemMenuConfigurationPayloadInput,
  expectedUpdatedAt: string,
): UpdateSystemMenuPayload {
  return {
    ...buildSystemMenuConfigurationPayload(value, normalizeSystemMenuIcon(value.icon)),
    expectedUpdatedAt,
  }
}

export function buildSystemMenuCreatePayload(model: SystemMenuFormModel): CreateSystemMenuPayload {
  return {
    parentId: model.parentId,
    name: model.name.trim(),
    title: model.title.trim(),
    icon: normalizeSystemMenuIcon(model.icon) || undefined,
    path: model.path.trim(),
    routeName: model.routeName.trim(),
    menuType: model.menuType,
    sort: Number(model.sort) || 0,
    status: model.status,
    visible: model.visible,
  }
}

export function buildSystemMenuUpdatePayload(
  model: SystemMenuFormModel,
): Omit<UpdateSystemMenuPayload, 'expectedUpdatedAt'> {
  return {
    parentId: model.parentId,
    name: model.name.trim(),
    title: model.title.trim(),
    icon: normalizeSystemMenuIcon(model.icon),
    path: model.path.trim(),
    routeName: model.routeName.trim(),
    menuType: model.menuType,
    sort: Number(model.sort) || 0,
    status: model.status,
    visible: model.visible,
  }
}
