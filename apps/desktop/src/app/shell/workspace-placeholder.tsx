import type { ShellMenuKey } from '@/shared/config/preferences'
import { workspaceCopy } from '@/shared/config/shell'
import { useTranslation } from '@/shared/i18n/use-translation'

interface WorkspacePlaceholderProps {
  activeMenu: ShellMenuKey
}

export function WorkspacePlaceholder({ activeMenu }: WorkspacePlaceholderProps) {
  const { t } = useTranslation()
  const copy = workspaceCopy[activeMenu]

  return (
    <section
      aria-label={t('shell.workspace.label')}
      className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-8 pb-16 pt-8"
    >
      <div className="max-w-140 w-full text-center">
        <p className="text-(--text-muted) text-[11px] font-medium uppercase">
          {t('shell.workspace.label')}
        </p>
        <h2 className="text-(--text-primary) mt-3 text-[28px] font-semibold leading-9">
          {t(copy.titleKey)}
        </h2>
        <p className="text-(--text-secondary) mt-3 text-[15px] leading-6">
          {t(copy.descriptionKey)}
        </p>
        <p className="text-(--text-muted) mt-2 text-sm leading-5">{t(copy.emptyKey)}</p>
      </div>
    </section>
  )
}
