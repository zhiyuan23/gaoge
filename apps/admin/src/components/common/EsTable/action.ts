import type { TableAction } from './types'

export const ACTION_COLUMN_MIN_WIDTH = 120

export type AuthChecker = (value: string | string[]) => boolean

// 解析 action 的显隐配置，兼容布尔值和行级函数。
function resolveActionVisible(action: TableAction, row?: any) {
  if (typeof action.visible === 'function') {
    return row === undefined ? true : action.visible(row)
  }

  return action.visible
}

// 结合显隐配置和权限判断 action 是否可见。
export function isActionVisible(action: TableAction, auth: AuthChecker, row?: any) {
  const visible = resolveActionVisible(action, row)
  if (visible === false) {
    return false
  }

  return action.auth ? auth(action.auth) : true
}

// 解析 action 的禁用配置，兼容布尔值和行级函数。
export function isActionDisabled(action: TableAction, row: any) {
  return typeof action.disabled === 'function' ? action.disabled(row) : Boolean(action.disabled)
}

// 判断当前列在当前数据和权限下是否还需要显示操作入口。
export function hasVisibleActions(actions: TableAction[] = [], rows: any[], auth: AuthChecker) {
  if (!actions.length) {
    return false
  }

  if (!rows.length) {
    return actions.some((action) => isActionVisible(action, auth))
  }

  return rows.some((row) => actions.some((action) => isActionVisible(action, auth, row)))
}
