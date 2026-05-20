import type { SystemMenu } from '@/api/system/menu'

import type { SystemMenuFormModel, SystemMenuSearch } from './types'

export const SYSTEM_MENU_DEFAULT_SEARCH: SystemMenuSearch = {
  keyword: '',
  menuType: '',
  status: '',
}

export function createEmptySystemMenuForm(): SystemMenuFormModel {
  return {
    parentId: null,
    name: '',
    title: '',
    icon: '',
    path: '',
    routeName: '',
    menuType: 'menu',
    sort: 0,
    status: 'active',
    visible: true,
  }
}

export function createSystemMenuFormFromRow(menu: SystemMenu): SystemMenuFormModel {
  return {
    parentId: menu.parentId,
    name: menu.name,
    title: menu.title,
    icon: menu.icon ?? '',
    path: menu.path,
    routeName: menu.routeName,
    menuType: menu.menuType,
    sort: menu.sort,
    status: menu.status,
    visible: menu.visible,
  }
}
