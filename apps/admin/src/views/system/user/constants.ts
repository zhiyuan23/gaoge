/** 用户角色中文名映射 */
export const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  viewer: '浏览者',
  user: '普通用户',
}

export const ADMIN_ROLE_OPTIONS = [
  { label: ROLE_LABELS.admin, value: 'admin' },
  { label: ROLE_LABELS.viewer, value: 'viewer' },
]
