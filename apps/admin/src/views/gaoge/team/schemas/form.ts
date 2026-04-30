import type { FormRules } from 'element-plus'

import type { TeamFormModel } from '../model/types'

export const TEAM_FORM_RULES: FormRules<TeamFormModel> = {
  name: [{ required: true, message: '请输入球队名称', trigger: 'blur' }],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' },
    {
      validator: (_rule, value: number | null, callback) => {
        if (!Number.isInteger(value) || value === null || value < 0) {
          callback(new Error('排序需为大于等于 0 的整数'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}
