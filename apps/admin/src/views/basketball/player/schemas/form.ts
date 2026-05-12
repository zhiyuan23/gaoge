import type { FormRules } from 'element-plus'

import type { SearchOption } from '@/components/common/EsSearch/types'

import type { PlayerFormModel } from '../model/types'

export const PLAYER_STATUS_OPTIONS: SearchOption[] = [
  { label: '正常', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export function getPlayerStatusTagType(status: string) {
  if (status === 'active') {
    return 'success'
  }
  if (status === 'inactive') {
    return 'info'
  }
  return 'warning'
}

export function getPlayerStatusLabel(status: string) {
  if (status === 'active') {
    return '正常'
  }
  if (status === 'inactive') {
    return '停用'
  }
  return status || '-'
}

export const PLAYER_FORM_RULES: FormRules<PlayerFormModel> = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  playerNumber: [
    { required: true, message: '请输入球员号码', trigger: 'blur' },
    {
      validator: (_rule, value: number | null, callback) => {
        if (!Number.isInteger(value) || value === null || value < 0 || value > 100) {
          callback(new Error('球员号码需为 0 到 100 的整数'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}
