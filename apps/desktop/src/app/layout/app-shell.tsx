import { useEffect, useState } from 'react'

import { Sidebar } from '@/features/codex-shell/sidebar'
import { WorkspacePlaceholder } from '@/features/codex-shell/workspace-placeholder'
import type { ShellMenuKey } from '@/shared/config/preferences'
import { usePreferenceStore } from '@/state/preferences-store'

export function AppShell() {
  const density = usePreferenceStore((state) => state.density)
  const fontSize = usePreferenceStore((state) => state.fontSize)
  const hydrated = usePreferenceStore((state) => state.hydrated)
  const reduceMotion = usePreferenceStore((state) => state.reduceMotion)
  const sidebarLabels = usePreferenceStore((state) => state.sidebarLabels)
  const startupView = usePreferenceStore((state) => state.startupView)
  const [activeMenu, setActiveMenu] = useState<ShellMenuKey>(startupView)

  useEffect(() => {
    if (hydrated) {
      setActiveMenu(startupView)
    }
  }, [hydrated, startupView])

  return (
    <div
      className={[
        'flex min-h-screen bg-[image:var(--app-bg)] text-[color:var(--text-primary)] transition-colors',
        density === 'compact' ? 'app-density-compact' : 'app-density-comfortable',
        fontSize === 'small' ? 'app-font-small' : '',
        fontSize === 'large' ? 'app-font-large' : '',
        reduceMotion ? 'app-reduce-motion' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Sidebar
        activeMenu={activeMenu}
        labels={sidebarLabels}
        onOpenSettings={() => undefined}
        onSelectMenu={setActiveMenu}
      />
      <main className="min-h-screen min-w-0 flex-1 overflow-y-auto">
        <WorkspacePlaceholder activeMenu={activeMenu} />
      </main>
    </div>
  )
}
