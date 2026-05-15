import { getMessage, type MessageKey } from '@/shared/i18n/messages'
import { usePreferenceStore } from '@/state/preferences-store'

export function useTranslation() {
  const language = usePreferenceStore((state) => state.language)

  return {
    language,
    t(key: MessageKey, params?: Record<string, string | number>): string {
      const template = getMessage(language, key)

      if (!params) {
        return template
      }

      return Object.entries(params).reduce<string>(
        (message, [name, value]) => message.replace(`{${name}}`, String(value)),
        template,
      )
    },
  }
}
