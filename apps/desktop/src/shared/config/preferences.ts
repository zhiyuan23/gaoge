export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
export type Language = 'zh-CN' | 'en-US'
export type ShellMenuKey = 'chats' | 'tasks' | 'code-review' | 'environments'
export type Density = 'comfortable' | 'compact'
export type SidebarLabels = 'show' | 'hide'
export type FontSize = 'small' | 'default' | 'large'

export interface DesktopPreferences {
  autoCheckUpdates: boolean
  confirmActions: boolean
  density: Density
  enableNotifications: boolean
  fontSize: FontSize
  language: Language
  reduceMotion: boolean
  sidebarLabels: SidebarLabels
  startupView: ShellMenuKey
  themeMode: ThemeMode
}

export const desktopPreferenceKeys = {
  autoCheckUpdates: 'desktop-auto-check-updates',
  confirmActions: 'desktop-confirm-actions',
  density: 'desktop-density',
  enableNotifications: 'desktop-enable-notifications',
  fontSize: 'desktop-font-size',
  language: 'desktop-language',
  reduceMotion: 'desktop-reduce-motion',
  sidebarLabels: 'desktop-sidebar-labels',
  startupView: 'desktop-startup-view',
  themeMode: 'desktop-theme-mode',
} as const

export const defaultDesktopPreferences: DesktopPreferences = {
  autoCheckUpdates: true,
  confirmActions: true,
  density: 'comfortable',
  enableNotifications: true,
  fontSize: 'default',
  language: 'zh-CN',
  reduceMotion: false,
  sidebarLabels: 'show',
  startupView: 'chats',
  themeMode: 'dark',
}

export const defaultLanguage = defaultDesktopPreferences.language
export const defaultThemeMode = defaultDesktopPreferences.themeMode

export function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function isLanguage(value: string | null): value is Language {
  return value === 'zh-CN' || value === 'en-US'
}

export function isShellMenuKey(value: string | null): value is ShellMenuKey {
  return (
    value === 'chats' || value === 'tasks' || value === 'code-review' || value === 'environments'
  )
}

export function isDensity(value: string | null): value is Density {
  return value === 'comfortable' || value === 'compact'
}

export function isSidebarLabels(value: string | null): value is SidebarLabels {
  return value === 'show' || value === 'hide'
}

export function isFontSize(value: string | null): value is FontSize {
  return value === 'small' || value === 'default' || value === 'large'
}

export function parseBooleanPreference(value: string | null, fallback: boolean) {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return fallback
}

export function serializeBooleanPreference(value: boolean) {
  return value ? 'true' : 'false'
}

export function getSystemPrefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === 'system') {
    return prefersDark ? 'dark' : 'light'
  }

  return mode
}
