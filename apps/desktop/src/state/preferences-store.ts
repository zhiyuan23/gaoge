import { create } from 'zustand'

import { electronBridge } from '@/bridges/electron'
import {
  defaultDesktopPreferences,
  type Density,
  desktopPreferenceKeys,
  type DesktopPreferences,
  type FontSize,
  getSystemPrefersDark,
  isDensity,
  isFontSize,
  isLanguage,
  isShellMenuKey,
  isSidebarLabels,
  isThemeMode,
  type Language,
  parseBooleanPreference,
  type ResolvedTheme,
  resolveTheme,
  serializeBooleanPreference,
  type ShellMenuKey,
  type SidebarLabels,
  type ThemeMode,
} from '@/shared/config/preferences'

interface PreferenceState extends DesktopPreferences {
  hydrated: boolean
  resolvedTheme: ResolvedTheme
  hydrate(): Promise<void>
  setAutoCheckUpdates(value: boolean): Promise<void>
  setConfirmActions(value: boolean): Promise<void>
  setDensity(value: Density): Promise<void>
  setEnableNotifications(value: boolean): Promise<void>
  setFontSize(value: FontSize): Promise<void>
  setLanguage(language: Language): Promise<void>
  setReduceMotion(value: boolean): Promise<void>
  setSidebarLabels(value: SidebarLabels): Promise<void>
  setStartupView(value: ShellMenuKey): Promise<void>
  setThemeMode(mode: ThemeMode): Promise<void>
  syncSystemTheme(isDark: boolean): void
}

function getDefaultState() {
  return {
    ...defaultDesktopPreferences,
    hydrated: false,
    resolvedTheme: resolveTheme(defaultDesktopPreferences.themeMode, getSystemPrefersDark()),
  }
}

async function persistBooleanPreference(key: string, value: boolean) {
  await electronBridge.db.setSetting(key, serializeBooleanPreference(value))
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  ...getDefaultState(),
  async hydrate() {
    if (get().hydrated) {
      return
    }

    const [
      savedAutoCheckUpdates,
      savedConfirmActions,
      savedDensity,
      savedEnableNotifications,
      savedFontSize,
      savedLanguage,
      savedReduceMotion,
      savedSidebarLabels,
      savedStartupView,
      savedThemeMode,
    ] = await Promise.all([
      electronBridge.db.getSetting(desktopPreferenceKeys.autoCheckUpdates),
      electronBridge.db.getSetting(desktopPreferenceKeys.confirmActions),
      electronBridge.db.getSetting(desktopPreferenceKeys.density),
      electronBridge.db.getSetting(desktopPreferenceKeys.enableNotifications),
      electronBridge.db.getSetting(desktopPreferenceKeys.fontSize),
      electronBridge.db.getSetting(desktopPreferenceKeys.language),
      electronBridge.db.getSetting(desktopPreferenceKeys.reduceMotion),
      electronBridge.db.getSetting(desktopPreferenceKeys.sidebarLabels),
      electronBridge.db.getSetting(desktopPreferenceKeys.startupView),
      electronBridge.db.getSetting(desktopPreferenceKeys.themeMode),
    ])

    const themeMode = isThemeMode(savedThemeMode)
      ? savedThemeMode
      : defaultDesktopPreferences.themeMode

    set({
      autoCheckUpdates: parseBooleanPreference(
        savedAutoCheckUpdates,
        defaultDesktopPreferences.autoCheckUpdates,
      ),
      confirmActions: parseBooleanPreference(
        savedConfirmActions,
        defaultDesktopPreferences.confirmActions,
      ),
      density: isDensity(savedDensity) ? savedDensity : defaultDesktopPreferences.density,
      enableNotifications: parseBooleanPreference(
        savedEnableNotifications,
        defaultDesktopPreferences.enableNotifications,
      ),
      fontSize: isFontSize(savedFontSize) ? savedFontSize : defaultDesktopPreferences.fontSize,
      hydrated: true,
      language: isLanguage(savedLanguage) ? savedLanguage : defaultDesktopPreferences.language,
      reduceMotion: parseBooleanPreference(
        savedReduceMotion,
        defaultDesktopPreferences.reduceMotion,
      ),
      resolvedTheme: resolveTheme(themeMode, getSystemPrefersDark()),
      sidebarLabels: isSidebarLabels(savedSidebarLabels)
        ? savedSidebarLabels
        : defaultDesktopPreferences.sidebarLabels,
      startupView: isShellMenuKey(savedStartupView)
        ? savedStartupView
        : defaultDesktopPreferences.startupView,
      themeMode,
    })
  },
  async setAutoCheckUpdates(autoCheckUpdates) {
    set({ autoCheckUpdates })
    await persistBooleanPreference(desktopPreferenceKeys.autoCheckUpdates, autoCheckUpdates)
  },
  async setConfirmActions(confirmActions) {
    set({ confirmActions })
    await persistBooleanPreference(desktopPreferenceKeys.confirmActions, confirmActions)
  },
  async setDensity(density) {
    set({ density })
    await electronBridge.db.setSetting(desktopPreferenceKeys.density, density)
  },
  async setEnableNotifications(enableNotifications) {
    set({ enableNotifications })
    await persistBooleanPreference(desktopPreferenceKeys.enableNotifications, enableNotifications)
  },
  async setFontSize(fontSize) {
    set({ fontSize })
    await electronBridge.db.setSetting(desktopPreferenceKeys.fontSize, fontSize)
  },
  async setLanguage(language) {
    set({ language })
    await electronBridge.db.setSetting(desktopPreferenceKeys.language, language)
  },
  async setReduceMotion(reduceMotion) {
    set({ reduceMotion })
    await persistBooleanPreference(desktopPreferenceKeys.reduceMotion, reduceMotion)
  },
  async setSidebarLabels(sidebarLabels) {
    set({ sidebarLabels })
    await electronBridge.db.setSetting(desktopPreferenceKeys.sidebarLabels, sidebarLabels)
  },
  async setStartupView(startupView) {
    set({ startupView })
    await electronBridge.db.setSetting(desktopPreferenceKeys.startupView, startupView)
  },
  async setThemeMode(themeMode) {
    set({
      resolvedTheme: resolveTheme(themeMode, getSystemPrefersDark()),
      themeMode,
    })
    await electronBridge.db.setSetting(desktopPreferenceKeys.themeMode, themeMode)
  },
  syncSystemTheme(isDark) {
    if (get().themeMode !== 'system') {
      return
    }

    set({ resolvedTheme: isDark ? 'dark' : 'light' })
  },
}))

export function resetPreferenceStore() {
  usePreferenceStore.setState(getDefaultState())
}
