import type { MiniappRumorPostListParams, MiniappRumorPostListResponse } from '@gaoge/shared-types'

import api from '@/api/request'

export const requestRumorPosts = (params?: MiniappRumorPostListParams) =>
  api.get<MiniappRumorPostListResponse>('/miniapp/rumor-posts', params, {
    skipAuth: true,
  })
