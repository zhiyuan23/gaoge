import type { FormRules } from 'element-plus'

import type { BannerJumpType, BannerStatus } from '@gaoge/shared-types'

import type { SearchOption } from '@/components/common/EsSearch/types'

import type { BannerFormModel } from '../model/types'

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

export function createBannerFormRules(model: BannerFormModel): FormRules<BannerFormModel> {
  return {
    title: [{ required: true, message: '请输入 Banner 标题', trigger: 'blur' }],
    imageUrl: [{ required: true, message: '请上传或填写 Banner 图片', trigger: 'blur' }],
    jumpUrl: [
      {
        validator: (_rule, value: string, callback) => {
          const normalized = String(value ?? '').trim()

          if (model.jumpType === 'none') {
            callback()
            return
          }

          if (model.jumpType === 'webview') {
            if (!normalized || !/^https?:\/\//.test(normalized)) {
              callback(new Error('请填写 http:// 或 https:// 开头的链接'))
              return
            }

            callback()
            return
          }

          if (model.jumpType === 'miniapp') {
            if (!normalized || !/^\/pages\//.test(normalized)) {
              callback(new Error('请填写以 /pages/ 开头的小程序页面路径'))
              return
            }
          }

          callback()
        },
        trigger: 'blur',
      },
    ],
    sort: [
      { required: true, message: '请输入排序值', trigger: 'blur' },
      {
        validator: (_rule, value: number, callback) => {
          if (!Number.isInteger(value) || value < 0 || value > 999) {
            callback(new Error('排序值需为 0 到 999 的整数'))
            return
          }

          callback()
        },
        trigger: 'blur',
      },
    ],
  }
}
