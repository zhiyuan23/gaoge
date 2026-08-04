import type { FormRules } from 'element-plus'

import { FOOTBALL_POSITION_OPTIONS, type FootballPosition } from '@gaoge/shared-types'

import type { SearchOption } from '@/components/common/EsSearch/types'

import type { PlayerFormModel } from '../model/types'

export const PLAYER_STATUS_OPTIONS: SearchOption[] = [
  { label: '正常', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export const PLAYER_POSITION_OPTIONS: SearchOption[] = FOOTBALL_POSITION_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value,
}))

export function getFootballPositionLabel(position: FootballPosition | string | null | undefined) {
  if (!position) {
    return '-'
  }

  return FOOTBALL_POSITION_OPTIONS.find((item) => item.value === position)?.label ?? position
}

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
  teamIds: [{ required: true, message: '请选择代表球队', trigger: 'change' }],
  positions: [{ required: true, message: '请选择可踢位置', trigger: 'change' }],
  superheroName: [{ max: 50, message: '超级英雄最多 50 个字符', trigger: 'blur' }],
  signature: [{ max: 15, message: '签名最多 15 个字', trigger: 'blur' }],
}
