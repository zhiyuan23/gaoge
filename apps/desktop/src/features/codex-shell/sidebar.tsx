import type { ShellMenuKey, SidebarLabels } from '@/shared/config/preferences'
import { useTranslation } from '@/shared/i18n/use-translation'

import { shellMenuItems } from './shell-options'

interface SidebarProps {
  activeMenu: ShellMenuKey
  labels: SidebarLabels
  onOpenSettings(): void
  onSelectMenu(menu: ShellMenuKey): void
}

function getMenuInitial(label: string) {
  return label
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
}

export function Sidebar({ activeMenu, labels, onOpenSettings, onSelectMenu }: SidebarProps) {
  const { t } = useTranslation()
  const showLabels = labels === 'show'

  return (
    <aside className="app-drag-region flex min-h-screen w-[84px] flex-col border-r border-[color:var(--border-soft)] bg-[color:var(--chrome-bg)] px-3 py-4 backdrop-blur md:w-[260px] md:px-4">
      <div className="px-2 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--accent-border)] bg-[color:var(--accent-surface)] text-sm font-semibold text-[color:var(--accent-strong)]">
          CX
        </div>
        {showLabels ? (
          <div className="mt-4 hidden md:block">
            <h1 className="text-xl font-semibold text-[color:var(--text-primary)]">
              {t('shell.brand.title')}
            </h1>
            <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
              {t('shell.brand.subtitle')}
            </p>
          </div>
        ) : null}
      </div>

      <nav className="app-no-drag mt-5 flex flex-col gap-1">
        {shellMenuItems.map((item) => {
          const label = t(item.labelKey)
          const isActive = item.key === activeMenu

          return (
            <button
              key={item.key}
              aria-label={label}
              aria-pressed={isActive}
              className={[
                'flex h-11 items-center gap-3 rounded-lg border px-3 text-left text-sm font-medium transition',
                isActive
                  ? 'border-[color:var(--link-active-border)] bg-[color:var(--link-active-bg)] text-[color:var(--link-active-text)] shadow-[0_12px_28px_var(--link-active-shadow)]'
                  : 'border-transparent text-[color:var(--text-secondary)] hover:border-[color:var(--border-soft)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--text-primary)]',
              ].join(' ')}
              onClick={() => onSelectMenu(item.key)}
              type="button"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--panel-muted)] text-xs font-semibold">
                {getMenuInitial(label)}
              </span>
              {showLabels ? <span className="hidden md:inline">{label}</span> : null}
            </button>
          )
        })}
      </nav>

      <div className="app-no-drag mt-auto">
        <button
          aria-label={t('shell.settings')}
          className="flex h-11 w-full items-center gap-3 rounded-lg border border-transparent px-3 text-left text-sm font-medium text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-soft)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--text-primary)]"
          onClick={onOpenSettings}
          type="button"
        >
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--panel-muted)] text-xs font-semibold">
            S
          </span>
          {showLabels ? <span className="hidden md:inline">{t('shell.settings')}</span> : null}
        </button>
      </div>
    </aside>
  )
}
