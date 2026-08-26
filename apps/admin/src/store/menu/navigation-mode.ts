export function shouldFilterMenusByPermission(
  routeBaseOn: 'frontend' | 'backend' | 'filesystem' | undefined,
  enablePermission: boolean,
) {
  return routeBaseOn !== 'backend' && enablePermission
}
