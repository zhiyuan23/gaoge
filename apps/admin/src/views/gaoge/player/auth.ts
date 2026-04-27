import useAuth from '@/composables/useAuth'

export const PLAYER_PERMISSIONS = {
  create: 'player:create',
  update: 'player:update',
  delete: 'player:delete',
} as const

export const PLAYER_MANAGE_PERMISSIONS = [
  PLAYER_PERMISSIONS.create,
  PLAYER_PERMISSIONS.update,
  PLAYER_PERMISSIONS.delete,
]

// player 权限判断收敛在业务模块内，避免污染通用 user store。
export function usePlayerAuth() {
  const { auth, authAll } = useAuth()

  const canCreatePlayer = computed(() => auth(PLAYER_PERMISSIONS.create))
  const canUpdatePlayer = computed(() => auth(PLAYER_PERMISSIONS.update))
  const canDeletePlayer = computed(() => auth(PLAYER_PERMISSIONS.delete))
  const canManagePlayers = computed(() => authAll(PLAYER_MANAGE_PERMISSIONS))

  return {
    canCreatePlayer,
    canUpdatePlayer,
    canDeletePlayer,
    canManagePlayers,
  }
}
