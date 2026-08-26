import type { TableAction, TableColumn } from './types'

export const ACTION_COLUMN_MIN_WIDTH = 120

export type AuthChecker = (value: string | string[]) => boolean

export function normalizeTableColumnWidth(column: TableColumn): TableColumn {
  const { fixedWidth, width, minWidth, ...rest } = column
  if (typeof fixedWidth === 'number') return { ...rest, width: fixedWidth }
  if (typeof minWidth === 'number') return { ...rest, minWidth, width }
  if (typeof width === 'number') return { ...rest, minWidth: width }
  return rest
}

export function normalizeActionColumnWidth(column: TableColumn): TableColumn {
  const normalized = normalizeTableColumnWidth(column)
  if (typeof column.fixedWidth === 'number') return normalized
  return { ...normalized, minWidth: Math.max(normalized.minWidth ?? 0, ACTION_COLUMN_MIN_WIDTH) }
}

export function partitionActions(actions: TableAction[], inlineLimit: number) {
  const limit = Math.max(1, Math.floor(inlineLimit))
  const useDropdown = actions.length > limit
  return {
    inlineActions: useDropdown ? actions.slice(0, limit - 1) : actions,
    secondaryActions: useDropdown ? actions.slice(limit - 1) : [],
    useDropdown,
  }
}

export function shouldDisableActionTooltips(inlineActionCount: number, useDropdown: boolean) {
  return inlineActionCount + Number(useDropdown) === 2
}

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

  if (!action.auth) return true
  if (Array.isArray(action.auth) && action.authMatch === 'all') {
    return action.auth.every((permission) => auth(permission))
  }
  return auth(action.auth)
}

// 解析 action 的禁用配置，兼容布尔值和行级函数。
export function isActionDisabled(action: TableAction, row: any) {
  return typeof action.disabled === 'function' ? action.disabled(row) : Boolean(action.disabled)
}

export function isActionLoading(action: TableAction, row: any) {
  return typeof action.loading === 'function' ? action.loading(row) : Boolean(action.loading)
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
