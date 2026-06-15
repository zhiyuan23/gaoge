import type { BannerJumpType, BannerStatus } from '@gaoge/shared-types'

import type { SearchOption } from '@/components/common/EsSearch/types'

export const BANNER_STATUS_OPTIONS: SearchOption[] = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export const BANNER_JUMP_TYPE_OPTIONS: SearchOption[] = [
  { label: '无跳转', value: 'none' },
  { label: '网页', value: 'webview' },
  { label: '小程序', value: 'miniapp' },
]

export function getBannerStatusLabel(status: BannerStatus) {
  if (status === 'active') {
    return '启用'
  }
  if (status === 'inactive') {
    return '停用'
  }

  return status
}

export function getBannerStatusTagType(status: BannerStatus) {
  if (status === 'active') {
    return 'success'
  }

  return 'info'
}

export function getBannerJumpTypeLabel(jumpType: BannerJumpType) {
  if (jumpType === 'none') {
    return '无跳转'
  }
  if (jumpType === 'webview') {
    return '网页'
  }
  if (jumpType === 'miniapp') {
    return '小程序'
  }

  return jumpType
}
