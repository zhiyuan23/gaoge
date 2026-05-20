import type { CreateSystemMenuPayload, UpdateSystemMenuPayload } from '@gaoge/shared-types'

import type { SystemMenuFormModel } from './types'

export function buildSystemMenuCreatePayload(model: SystemMenuFormModel): CreateSystemMenuPayload {
  return {
    parentId: model.parentId,
    name: model.name.trim(),
    title: model.title.trim(),
    icon: model.icon.trim() || undefined,
    path: model.path.trim(),
    routeName: model.routeName.trim(),
    menuType: model.menuType,
    sort: Number(model.sort) || 0,
    status: model.status,
    visible: model.visible,
  }
}

export function buildSystemMenuUpdatePayload(model: SystemMenuFormModel): UpdateSystemMenuPayload {
  return {
    parentId: model.parentId,
    name: model.name.trim(),
    title: model.title.trim(),
    icon: model.icon.trim() || undefined,
    path: model.path.trim(),
    routeName: model.routeName.trim(),
    menuType: model.menuType,
    sort: Number(model.sort) || 0,
    status: model.status,
    visible: model.visible,
  }
}
