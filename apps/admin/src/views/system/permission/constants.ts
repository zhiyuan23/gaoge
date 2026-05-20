export function formatModuleOptions(
  permissionList: { module: string }[],
): { label: string; value: string }[] {
  return [...new Set(permissionList.map((item) => item.module))].map((item) => ({
    label: item,
    value: item,
  }))
}
