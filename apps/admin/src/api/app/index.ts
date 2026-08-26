import type { AdminNavigationNode } from '@gaoge/shared-types'

import api from '../index'

export default {
  // 服务端解析的受控导航菜单数据
  menuList: () => api.get<AdminNavigationNode[]>('admin/navigation'),
}
