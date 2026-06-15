import type { FormRules } from 'element-plus'

import type { MatchRoundFormModel, MatchRoundResultFormItem } from '../model/types'

function validateResults(
  _rule: unknown,
  value: MatchRoundResultFormItem[] | undefined,
  callback: (error?: Error) => void,
) {
  if (!Array.isArray(value) || value.length !== 3) {
    callback(new Error('当前球队配置异常，需恰好存在 3 支球队'))
    return
  }

  const ranks = value.map((item) => item.rank)
  if (ranks.some((rank) => rank === null)) {
    callback(new Error('请为 3 支球队都选择名次'))
    return
  }

  if (new Set(ranks).size !== value.length) {
    callback(new Error('3 支球队名次不能重复'))
    return
  }

  callback()
}

export const MATCH_ROUND_FORM_RULES: FormRules<MatchRoundFormModel> = {
  season: [{ required: true, message: '请选择赛季', trigger: 'change' }],
  round: [{ required: true, message: '请选择场次', trigger: 'change' }],
  matchDate: [{ required: true, message: '请选择比赛日期', trigger: 'change' }],
  results: [{ validator: validateResults, trigger: 'change' }],
}

export const MATCH_ROUND_RANK_OPTIONS = [
  { label: '第 1 名', value: 1 },
  { label: '第 2 名', value: 2 },
  { label: '第 3 名', value: 3 },
] as const
