import type {
  MiniappMessageBoardListParams,
  MiniappMessageBoardListResponse,
} from '@gaoge/shared-types'

import api from '@/api/request'

export const requestMessageBoardPosts = (params?: MiniappMessageBoardListParams) =>
  api.get<MiniappMessageBoardListResponse>('/miniapp/message-board-posts', params, {
    skipAuth: true,
  })
