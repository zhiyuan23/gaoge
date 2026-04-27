import type { FormRules } from 'element-plus'

import type { SearchOption } from '@/components/common/EsSearch/types'

import type { PlayerFormModel } from '../model/types'

export const PLAYER_STATUS_OPTIONS: SearchOption[] = [
  { label: '正常', value: 'active' },
  { label: '停用', value: 'inactive' },
]

export const PLAYER_FORM_RULES: FormRules<PlayerFormModel> = {
  openid: [{ required: true, message: '请输入 OpenID', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}
