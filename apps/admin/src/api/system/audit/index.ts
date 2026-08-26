import type { SystemAuditListParams, SystemAuditListResponse } from '@gaoge/shared-types'

import api from '@/api'

export default {
  list: (params?: SystemAuditListParams) =>
    api.get<SystemAuditListResponse>('/system/audit-events', { params }),
}
