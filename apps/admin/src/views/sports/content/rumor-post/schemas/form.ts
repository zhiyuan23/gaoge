import type { FormRules } from 'element-plus'

import { RUMOR_POST_STATUS_OPTIONS } from '../model/defaults'
import type { RumorPostFormModel } from '../model/types'

export { RUMOR_POST_STATUS_OPTIONS }

export function getRumorPostStatusLabel(status: string) {
  if (status === 'draft') {
    return '草稿'
  }
  if (status === 'published') {
    return '已发布'
  }

  return status || '-'
}

export function getRumorPostStatusTagType(status: string) {
  if (status === 'published') {
    return 'success'
  }
  if (status === 'draft') {
    return 'info'
  }

  return 'warning'
}

function validateOptionalUrl(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (!value?.trim()) {
    callback()
    return
  }

  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) {
      callback(new Error('请输入有效的来源链接'))
      return
    }
    callback()
  } catch {
    callback(new Error('请输入有效的来源链接'))
  }
}

export const RUMOR_POST_FORM_RULES: FormRules<RumorPostFormModel> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }],
  sourceName: [{ required: true, message: '请输入来源名称', trigger: 'blur' }],
  sourceUrl: [{ validator: validateOptionalUrl, trigger: 'blur' }],
}
