export function formatRoleNames(
  roles: {
    id: number
    code: string
    name: string
  }[],
) {
  return roles.map((item) => item.name).join('、') || '-'
}
