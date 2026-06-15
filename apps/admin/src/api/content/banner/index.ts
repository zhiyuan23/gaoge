import type { Banner, BannerPayload, UpdateBannerPayload } from '@gaoge/shared-types'

import api from '@/api'

export type { Banner, BannerPayload, UpdateBannerPayload }

export interface BannerListParams {
  keyword?: string
  status?: Banner['status']
  jumpType?: Banner['jumpType']
}

export default {
  list: (params?: BannerListParams) => api.get<Banner[]>('/content/banners/admin', { params }),
  create: (data: BannerPayload) => api.post<Banner>('/content/banners', data),
  update: (id: number, data: UpdateBannerPayload) =>
    api.patch<Banner>(`/content/banners/${id}`, data),
  remove: (id: number) => api.delete<Banner>(`/content/banners/${id}`),
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post<{ imageUrl: string }>('/content/banners/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
