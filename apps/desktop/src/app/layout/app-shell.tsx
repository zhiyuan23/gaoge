import { useEffect, useRef, useState } from 'react'

import { Sidebar } from '@/app/shell/sidebar'
import { WorkspacePlaceholder } from '@/app/shell/workspace-placeholder'
import { SettingsDialog } from '@/features/settings/settings-dialog'
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const initializedFromStartupView = useRef(false)

  useEffect(() => {
    if (hydrated && !initializedFromStartupView.current) {
      initializedFromStartupView.current = true
      setActiveMenu(startupView)
    }
  }, [hydrated, startupView])

  return (
    <div
      className={[
        'bg-(--app-bg) text-(--text-primary) flex min-h-screen transition-colors',
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
        onOpenSettings={() => setSettingsOpen(true)}
        onSelectMenu={setActiveMenu}
      />
      <main className="bg-(--workspace-bg) flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <div
          aria-hidden="true"
          className="app-drag-region border-(--border-subtle) bg-(--workspace-bg) h-12 shrink-0 border-b"
        />
        <WorkspacePlaceholder activeMenu={activeMenu} />
      </main>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
