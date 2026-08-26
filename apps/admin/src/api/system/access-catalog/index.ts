import type { SystemAccessCatalog } from '@gaoge/shared-types'

import api from '@/api'

export default {
  get: () => api.get<SystemAccessCatalog>('/system/access-catalog'),
}
