import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import { usePreferenceStore } from '@/state/preferences-store'

const queryClient = new QueryClient()

function PreferenceRuntime() {
  const hydrate = usePreferenceStore((state) => state.hydrate)
  const resolvedTheme = usePreferenceStore((state) => state.resolvedTheme)
  const syncSystemTheme = usePreferenceStore((state) => state.syncSystemTheme)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    syncSystemTheme(mediaQuery.matches)

    function handleChange(event: MediaQueryListEvent) {
      syncSystemTheme(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [syncSystemTheme])

  return null
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <PreferenceRuntime />
      {children}
    </QueryClientProvider>
  )
}
