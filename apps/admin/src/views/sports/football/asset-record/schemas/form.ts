import type { FormRules } from 'element-plus'

import type { SearchOption } from '@/components/common/EsSearch/types'

import {
  ASSET_RECORD_DIRECTION_OPTIONS,
  ASSET_RECORD_EXPENSE_TYPE_OPTIONS,
  ASSET_RECORD_INCOME_TYPE_OPTIONS,
  ASSET_RECORD_STATUS_OPTIONS,
} from '../model/defaults'
import type { AssetRecordFormModel } from '../model/types'

export { ASSET_RECORD_DIRECTION_OPTIONS, ASSET_RECORD_STATUS_OPTIONS }

export const ASSET_RECORD_INCOME_TYPE_OPTION_LIST = ASSET_RECORD_INCOME_TYPE_OPTIONS
export const ASSET_RECORD_EXPENSE_TYPE_OPTION_LIST = ASSET_RECORD_EXPENSE_TYPE_OPTIONS

export function getAssetRecordDirectionLabel(value: string) {
  return value === 'income' ? '收入' : value === 'expense' ? '支出' : value || '-'
}

export function getAssetRecordDirectionTagType(value: string) {
  return value === 'income' ? 'success' : value === 'expense' ? 'danger' : 'info'
}

export function getAssetRecordTypeLabel(value: string) {
  const map: Record<string, string> = {
    match_fee: '比赛收费',
    extra_income: '额外收入',
    equipment: '球队装备',
    activity: '活动支出',
    other_expense: '其他支出',
  }

  return map[value] || value || '-'
}

export function getAssetRecordStatusLabel(value: string) {
  return value === 'confirmed' ? '已确认' : value === 'cancelled' ? '已取消' : value || '-'
}

export function getAssetRecordStatusTagType(value: string) {
  return value === 'confirmed' ? 'success' : value === 'cancelled' ? 'info' : 'warning'
}

export function getAssetRecordTypeOptions(direction: string): SearchOption[] {
  return direction === 'expense'
    ? ASSET_RECORD_EXPENSE_TYPE_OPTION_LIST
    : ASSET_RECORD_INCOME_TYPE_OPTION_LIST
}

export function createAssetRecordFormRules(
  model: AssetRecordFormModel,
): FormRules<AssetRecordFormModel> {
  return {
    direction: [{ required: true, message: '请选择收支方向', trigger: 'change' }],
    recordType: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    recordDate: [{ required: true, message: '请选择记录日期', trigger: 'change' }],
    amount: [
      {
        validator: (_rule, value: number | null, callback) => {
          if (model.isWaived) {
            callback()
            return
          }

          if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
            callback(new Error('请输入大于 0 的金额'))
            return
          }

          callback()
        },
        trigger: 'blur',
      },
    ],
  }
}
