import type { ShellMenuKey, SidebarLabels } from '@/shared/config/preferences'
import { shellMenuItems } from '@/shared/config/shell'
import { useTranslation } from '@/shared/i18n/use-translation'

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
    <aside className="app-drag-region w-19 border-(--border-subtle) bg-(--chrome-bg) md:w-61 flex min-h-screen flex-col border-r px-2.5 py-3 md:px-3">
      <div className="px-1.5 pb-3 pt-4">
        {showLabels ? (
          <div className="mt-3 hidden md:block">
            <h1 className="text-(--text-primary) text-[15px] font-semibold leading-5">
              {t('shell.brand.title')}
            </h1>
            <p className="text-(--text-muted) mt-0.5 text-xs leading-4">
              {t('shell.brand.subtitle')}
            </p>
          </div>
        ) : null}
      </div>

      <nav className="app-no-drag mt-2 flex flex-col gap-0.5">
        {shellMenuItems.map((item) => {
          const label = t(item.labelKey)
          const isActive = item.key === activeMenu

          return (
            <button
              key={item.key}
              aria-label={label}
              aria-pressed={isActive}
              className={[
                'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-left text-sm transition',
                isActive
                  ? 'bg-(--link-active-bg) text-(--link-active-text) font-medium'
                  : 'text-(--text-secondary) hover:bg-(--control-hover) hover:text-(--text-primary) font-normal',
              ].join(' ')}
              onClick={() => onSelectMenu(item.key)}
              type="button"
            >
              <span className="text-(--text-muted) inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-semibold">
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
          className="text-(--text-secondary) hover:bg-(--control-hover) hover:text-(--text-primary) flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-normal transition"
          onClick={onOpenSettings}
          type="button"
        >
          <span className="text-(--text-muted) inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-semibold">
            S
          </span>
          {showLabels ? <span className="hidden md:inline">{t('shell.settings')}</span> : null}
        </button>
      </div>
    </aside>
  )
}
