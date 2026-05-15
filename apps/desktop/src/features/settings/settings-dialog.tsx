import { useState } from 'react'

import type {
  Density,
  FontSize,
  Language,
  ShellMenuKey,
  SidebarLabels,
  ThemeMode,
} from '@/shared/config/preferences'
import { shellMenuItems } from '@/shared/config/shell'
import { useTranslation } from '@/shared/i18n/use-translation'
import { usePreferenceStore } from '@/state/preferences-store'

import { type SettingsSectionKey, settingsSections } from './settings-options'

interface SettingsDialogProps {
  open: boolean
  onClose(): void
}

interface RadioOption<T extends string> {
  label: string
  value: T
}

interface RadioGroupProps<T extends string> {
  legend: string
  name: string
  onChange(value: T): void
  options: RadioOption<T>[]
  value: T
}

function RadioGroup<T extends string>({
  legend,
  name,
  onChange,
  options,
  value,
}: RadioGroupProps<T>) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-(--text-primary) text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={[
              'flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition',
              option.value === value
                ? 'border-(--accent-border) bg-(--accent-surface) text-(--accent-strong)'
                : 'border-(--border-soft) bg-(--panel-bg) text-(--text-secondary) hover:text-(--text-primary)',
            ].join(' ')}
          >
            <input
              checked={option.value === value}
              className="accent-(--accent-strong)"
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface CheckboxFieldProps {
  checked: boolean
  label: string
  onChange(value: boolean): void
}

function CheckboxField({ checked, label, onChange }: CheckboxFieldProps) {
  return (
    <label className="border-(--border-soft) bg-(--panel-bg) text-(--text-primary) flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm">
      <input
        checked={checked}
        className="accent-(--accent-strong)"
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      {label}
    </label>
  )
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('general')
  const [status, setStatus] = useState(t('settings.status.idle'))
  const autoCheckUpdates = usePreferenceStore((state) => state.autoCheckUpdates)
  const confirmActions = usePreferenceStore((state) => state.confirmActions)
  const density = usePreferenceStore((state) => state.density)
  const enableNotifications = usePreferenceStore((state) => state.enableNotifications)
  const fontSize = usePreferenceStore((state) => state.fontSize)
  const language = usePreferenceStore((state) => state.language)
  const reduceMotion = usePreferenceStore((state) => state.reduceMotion)
  const sidebarLabels = usePreferenceStore((state) => state.sidebarLabels)
  const startupView = usePreferenceStore((state) => state.startupView)
  const themeMode = usePreferenceStore((state) => state.themeMode)
  const setAutoCheckUpdates = usePreferenceStore((state) => state.setAutoCheckUpdates)
  const setConfirmActions = usePreferenceStore((state) => state.setConfirmActions)
  const setDensity = usePreferenceStore((state) => state.setDensity)
  const setEnableNotifications = usePreferenceStore((state) => state.setEnableNotifications)
  const setFontSize = usePreferenceStore((state) => state.setFontSize)
  const setLanguage = usePreferenceStore((state) => state.setLanguage)
  const setReduceMotion = usePreferenceStore((state) => state.setReduceMotion)
  const setSidebarLabels = usePreferenceStore((state) => state.setSidebarLabels)
  const setStartupView = usePreferenceStore((state) => state.setStartupView)
  const setThemeMode = usePreferenceStore((state) => state.setThemeMode)

  if (!open) {
    return null
  }

  function markSaved(action: Promise<void>) {
    void action.then(() => setStatus(t('settings.status.saved')))
  }

  function markFakeAction() {
    setStatus(t('settings.status.fakeAction'))
  }

  const languageOptions: RadioOption<Language>[] = [
    { label: t('settings.language.zh-CN'), value: 'zh-CN' },
    { label: t('settings.language.en-US'), value: 'en-US' },
  ]
  const startupOptions: RadioOption<ShellMenuKey>[] = shellMenuItems.map((item) => ({
    label: t(item.labelKey),
    value: item.key,
  }))
  const themeOptions: RadioOption<ThemeMode>[] = [
    { label: t('settings.theme.light'), value: 'light' },
    { label: t('settings.theme.dark'), value: 'dark' },
    { label: t('settings.theme.system'), value: 'system' },
  ]
  const densityOptions: RadioOption<Density>[] = [
    { label: t('settings.density.comfortable'), value: 'comfortable' },
    { label: t('settings.density.compact'), value: 'compact' },
  ]
  const sidebarLabelOptions: RadioOption<SidebarLabels>[] = [
    { label: t('settings.sidebarLabels.show'), value: 'show' },
    { label: t('settings.sidebarLabels.hide'), value: 'hide' },
  ]
  const fontSizeOptions: RadioOption<FontSize>[] = [
    { label: t('settings.fontSize.small'), value: 'small' },
    { label: t('settings.fontSize.default'), value: 'default' },
    { label: t('settings.fontSize.large'), value: 'large' },
  ]

  return (
    <div className="app-no-drag fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <section
        aria-labelledby="settings-dialog-title"
        aria-modal="true"
        className="border-(--border-soft) bg-(--panel-bg) grid max-h-[90vh] w-full max-w-4xl grid-cols-1 overflow-hidden rounded-xl border shadow-2xl md:grid-cols-[220px_1fr]"
        role="dialog"
      >
        <div className="border-(--border-soft) bg-(--chrome-bg) border-b p-4 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-(--text-primary) text-lg font-semibold" id="settings-dialog-title">
              {t('settings.title')}
            </h2>
            <button
              aria-label={t('settings.close')}
              className="border-(--border-soft) text-(--text-secondary) hover:text-(--text-primary) rounded-lg border px-3 py-1 text-sm transition md:hidden"
              onClick={onClose}
              type="button"
            >
              X
            </button>
          </div>
          <div aria-orientation="vertical" className="mt-4 grid gap-1" role="tablist">
            {settingsSections.map((section) => {
              const label = t(section.labelKey)
              const selected = activeSection === section.key

              return (
                <button
                  key={section.key}
                  aria-selected={selected}
                  className={[
                    'rounded-lg border px-3 py-2 text-left text-sm font-medium transition',
                    selected
                      ? 'border-(--link-active-border) bg-(--link-active-bg) text-(--link-active-text)'
                      : 'text-(--text-secondary) hover:border-(--border-soft) hover:bg-(--panel-hover) hover:text-(--text-primary) border-transparent',
                  ].join(' ')}
                  onClick={() => setActiveSection(section.key)}
                  role="tab"
                  type="button"
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-140 flex flex-col overflow-y-auto">
          <div className="border-(--border-soft) hidden justify-end border-b p-4 md:flex">
            <button
              aria-label={t('settings.close')}
              className="border-(--border-soft) text-(--text-secondary) hover:text-(--text-primary) rounded-lg border px-3 py-1 text-sm transition"
              onClick={onClose}
              type="button"
            >
              X
            </button>
          </div>

          <div className="flex-1 space-y-5 p-5">
            {activeSection === 'general' ? (
              <>
                <RadioGroup
                  legend={t('settings.language.title')}
                  name="settings-language"
                  onChange={(value) => markSaved(setLanguage(value))}
                  options={languageOptions}
                  value={language}
                />
                <RadioGroup
                  legend={t('settings.startup.title')}
                  name="settings-startup"
                  onChange={(value) => markSaved(setStartupView(value))}
                  options={startupOptions}
                  value={startupView}
                />
                <div className="grid gap-2">
                  <CheckboxField
                    checked={enableNotifications}
                    label={t('settings.toggle.notifications')}
                    onChange={(value) => markSaved(setEnableNotifications(value))}
                  />
                  <CheckboxField
                    checked={autoCheckUpdates}
                    label={t('settings.toggle.autoUpdates')}
                    onChange={(value) => markSaved(setAutoCheckUpdates(value))}
                  />
                  <CheckboxField
                    checked={confirmActions}
                    label={t('settings.toggle.confirmActions')}
                    onChange={(value) => markSaved(setConfirmActions(value))}
                  />
                </div>
              </>
            ) : null}

            {activeSection === 'appearance' ? (
              <>
                <RadioGroup
                  legend={t('settings.theme.title')}
                  name="settings-theme"
                  onChange={(value) => markSaved(setThemeMode(value))}
                  options={themeOptions}
                  value={themeMode}
                />
                <RadioGroup
                  legend={t('settings.density.title')}
                  name="settings-density"
                  onChange={(value) => markSaved(setDensity(value))}
                  options={densityOptions}
                  value={density}
                />
                <RadioGroup
                  legend={t('settings.sidebarLabels.title')}
                  name="settings-sidebar-labels"
                  onChange={(value) => markSaved(setSidebarLabels(value))}
                  options={sidebarLabelOptions}
                  value={sidebarLabels}
                />
                <RadioGroup
                  legend={t('settings.fontSize.title')}
                  name="settings-font-size"
                  onChange={(value) => markSaved(setFontSize(value))}
                  options={fontSizeOptions}
                  value={fontSize}
                />
                <CheckboxField
                  checked={reduceMotion}
                  label={t('settings.toggle.reduceMotion')}
                  onChange={(value) => markSaved(setReduceMotion(value))}
                />
              </>
            ) : null}

            {activeSection === 'account' ? (
              <StaticSection
                buttonLabel="Refresh account"
                copy={t('settings.fake.account')}
                onAction={markFakeAction}
              />
            ) : null}

            {activeSection === 'model' ? (
              <StaticSection
                buttonLabel="Use GPT-5.4"
                copy={t('settings.fake.model')}
                onAction={markFakeAction}
              />
            ) : null}

            {activeSection === 'integrations' ? (
              <StaticSection
                buttonLabel="Check integrations"
                copy={t('settings.fake.integrations')}
                onAction={markFakeAction}
              />
            ) : null}

            {activeSection === 'advanced' ? (
              <StaticSection
                buttonLabel="Run diagnostics"
                copy={t('settings.fake.advanced')}
                onAction={markFakeAction}
              />
            ) : null}
          </div>

          <footer className="border-(--border-soft) text-(--text-secondary) border-t px-5 py-4 text-sm">
            {status}
          </footer>
        </div>
      </section>
    </div>
  )
}

interface StaticSectionProps {
  buttonLabel: string
  copy: string
  onAction(): void
}

function StaticSection({ buttonLabel, copy, onAction }: StaticSectionProps) {
  return (
    <div className="space-y-4">
      <p className="border-(--border-soft) bg-(--panel-muted) text-(--text-primary) rounded-lg border p-4 text-sm">
        {copy}
      </p>
      <button
        className="border-(--accent-border) bg-(--accent-surface) text-(--accent-strong) hover:bg-(--panel-hover) rounded-lg border px-4 py-2 text-sm font-medium transition"
        onClick={onAction}
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
