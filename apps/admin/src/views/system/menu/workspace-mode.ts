import { ref } from 'vue'

export type SystemAccessWorkspaceMode = 'menus' | 'resources'

export function resolveSystemAccessWorkspaceMode(value: unknown): SystemAccessWorkspaceMode {
  return value === 'resources' ? 'resources' : 'menus'
}

export function useSystemAccessWorkspaceMode() {
  const mode = ref<SystemAccessWorkspaceMode>('menus')
  const search = ref('')
  const mobileDetailOpen = ref(false)

  function switchMode(value: unknown) {
    mode.value = resolveSystemAccessWorkspaceMode(value)
    search.value = ''
    mobileDetailOpen.value = false
  }

  return { mobileDetailOpen, mode, search, switchMode }
}
