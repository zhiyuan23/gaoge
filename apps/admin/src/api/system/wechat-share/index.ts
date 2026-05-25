import type {
  UpdateWechatShareAdminConfigPayload,
  WechatShareAdminConfig,
} from '@gaoge/shared-types'

import api from '@/api'

export type { UpdateWechatShareAdminConfigPayload, WechatShareAdminConfig }

export default {
  detail: () => api.get<WechatShareAdminConfig>('/wechat/share/admin-config'),
  update: (data: UpdateWechatShareAdminConfigPayload) =>
    api.put<WechatShareAdminConfig>('/wechat/share/admin-config', data),
}
