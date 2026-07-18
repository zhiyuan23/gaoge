import type { Banner } from '@gaoge/shared-types'

import api from '@/api/request'

export const requestBanners = () =>
  api.get<Banner[]>('/content/banners', undefined, {
    skipAuth: true,
    toast: false,
  })
