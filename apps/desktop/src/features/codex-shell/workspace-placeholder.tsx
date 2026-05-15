import type { ShellMenuKey } from '@/shared/config/preferences'
import { useTranslation } from '@/shared/i18n/use-translation'

import { workspaceCopy } from './shell-options'

interface WorkspacePlaceholderProps {
  activeMenu: ShellMenuKey
}

export function WorkspacePlaceholder({ activeMenu }: WorkspacePlaceholderProps) {
  const { t } = useTranslation()
  const copy = workspaceCopy[activeMenu]

  return (
    <section
      aria-label={t('shell.workspace.label')}
      className="flex min-h-full flex-1 items-center justify-center p-6"
    >
      <div className="w-full max-w-2xl rounded-lg border border-dashed border-[color:var(--border-soft)] bg-[color:var(--panel-bg)] px-8 py-10 text-center shadow-[var(--panel-shadow)]">
        <p className="text-xs font-semibold uppercase text-[color:var(--accent-strong)]">
          {t('shell.workspace.label')}
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[color:var(--text-primary)]">
          {t(copy.titleKey)}
        </h2>
        <p className="mt-4 text-base text-[color:var(--text-secondary)]">
          {t(copy.descriptionKey)}
        </p>
        <p className="mt-3 text-sm text-[color:var(--text-muted)]">{t(copy.emptyKey)}</p>
      </div>
    </section>
  )
}
