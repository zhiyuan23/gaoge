import type { ShellMenuKey } from '@/shared/config/preferences'
import type { MessageKey } from '@/shared/i18n/messages'

export interface ShellMenuItem {
  key: ShellMenuKey
  labelKey: MessageKey
}

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

export const shellMenuItems: ShellMenuItem[] = [
  {
    key: 'chats',
    labelKey: 'shell.menu.chats',
  },
  {
    key: 'tasks',
    labelKey: 'shell.menu.tasks',
  },
  {
    key: 'code-review',
    labelKey: 'shell.menu.codeReview',
  },
  {
    key: 'environments',
    labelKey: 'shell.menu.environments',
  },
]

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

export const workspaceCopy: Record<
  ShellMenuKey,
  {
    descriptionKey: MessageKey
    emptyKey: MessageKey
    titleKey: MessageKey
  }
> = {
  chats: {
    descriptionKey: 'shell.workspace.chats.description',
    emptyKey: 'shell.workspace.chats.empty',
    titleKey: 'shell.workspace.chats.title',
  },
  tasks: {
    descriptionKey: 'shell.workspace.tasks.description',
    emptyKey: 'shell.workspace.tasks.empty',
    titleKey: 'shell.workspace.tasks.title',
  },
  'code-review': {
    descriptionKey: 'shell.workspace.codeReview.description',
    emptyKey: 'shell.workspace.codeReview.empty',
    titleKey: 'shell.workspace.codeReview.title',
  },
  environments: {
    descriptionKey: 'shell.workspace.environments.description',
    emptyKey: 'shell.workspace.environments.empty',
    titleKey: 'shell.workspace.environments.title',
  },
}
