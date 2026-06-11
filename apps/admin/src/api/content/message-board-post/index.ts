import type {
  MessageBoardPost,
  MessageBoardPostListParams,
  MessageBoardPostListResponse,
  MessageBoardPostPayload,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  MessageBoardPost,
  MessageBoardPostListParams,
  MessageBoardPostListResponse,
  MessageBoardPostPayload,
}

export default {
  list: (params?: MessageBoardPostListParams) =>
    api.get<MessageBoardPostListResponse>('/content/message-board-posts', { params }),
  create: (data: MessageBoardPostPayload) =>
    api.post<MessageBoardPost>('/content/message-board-posts', data),
  update: (id: number, data: MessageBoardPostPayload) =>
    api.patch<MessageBoardPost>(`/content/message-board-posts/${id}`, data),
  remove: (id: number) => api.delete<MessageBoardPost>(`/content/message-board-posts/${id}`),
  publish: (id: number) => api.post<MessageBoardPost>(`/content/message-board-posts/${id}/publish`),
}
