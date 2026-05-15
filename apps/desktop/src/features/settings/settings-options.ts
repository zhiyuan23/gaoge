import type { MessageKey } from '@/shared/i18n/messages'

export type SettingsSectionKey =
  | 'general'
  | 'appearance'
  | 'account'
  | 'model'
  | 'integrations'
  | 'advanced'

export interface SettingsSection {
  key: SettingsSectionKey
  labelKey: MessageKey
}

export const settingsSections: SettingsSection[] = [
  {
    key: 'general',
    labelKey: 'settings.section.general',
  },
  {
    key: 'appearance',
    labelKey: 'settings.section.appearance',
  },
  {
    key: 'account',
    labelKey: 'settings.section.account',
  },
  {
    key: 'model',
    labelKey: 'settings.section.model',
  },
  {
    key: 'integrations',
    labelKey: 'settings.section.integrations',
  },
  {
    key: 'advanced',
    labelKey: 'settings.section.advanced',
  },
]
