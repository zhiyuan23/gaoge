import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultDesktopPreferences, desktopPreferenceKeys } from '@/shared/config/preferences'

import { resetPreferenceStore, usePreferenceStore } from './preferences-store'

const bridgeMocks = vi.hoisted(() => ({
  getSetting: vi.fn<(key: string) => Promise<string | null>>(),
  setSetting: vi.fn<(key: string, value: string) => Promise<boolean>>(),
}))

vi.mock('@/bridges/electron', () => ({
  electronBridge: {
    db: {
      getSetting: bridgeMocks.getSetting,
      setSetting: bridgeMocks.setSetting,
    },
  },
}))

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
  })),
})

describe('usePreferenceStore', () => {
  beforeEach(() => {
    resetPreferenceStore()
    bridgeMocks.getSetting.mockReset()
    bridgeMocks.setSetting.mockReset()
  })

  it('hydrates default local preferences when saved values are missing', async () => {
    bridgeMocks.getSetting.mockResolvedValue(null)

    await usePreferenceStore.getState().hydrate()

    expect(usePreferenceStore.getState()).toMatchObject({
      autoCheckUpdates: defaultDesktopPreferences.autoCheckUpdates,
      confirmActions: defaultDesktopPreferences.confirmActions,
      density: defaultDesktopPreferences.density,
      enableNotifications: defaultDesktopPreferences.enableNotifications,
      fontSize: defaultDesktopPreferences.fontSize,
      language: defaultDesktopPreferences.language,
      reduceMotion: defaultDesktopPreferences.reduceMotion,
      sidebarLabels: defaultDesktopPreferences.sidebarLabels,
      startupView: defaultDesktopPreferences.startupView,
      themeMode: defaultDesktopPreferences.themeMode,
    })
  })

  it('hydrates persisted local preferences', async () => {
    bridgeMocks.getSetting.mockImplementation(async (key: string) => {
      const values: Record<string, string> = {
        [desktopPreferenceKeys.autoCheckUpdates]: 'false',
        [desktopPreferenceKeys.confirmActions]: 'false',
        [desktopPreferenceKeys.density]: 'compact',
        [desktopPreferenceKeys.enableNotifications]: 'true',
        [desktopPreferenceKeys.fontSize]: 'large',
        [desktopPreferenceKeys.language]: 'en-US',
        [desktopPreferenceKeys.reduceMotion]: 'true',
        [desktopPreferenceKeys.sidebarLabels]: 'hide',
        [desktopPreferenceKeys.startupView]: 'tasks',
        [desktopPreferenceKeys.themeMode]: 'system',
      }

      return values[key] ?? 'invalid'
    })

    await usePreferenceStore.getState().hydrate()

    expect(usePreferenceStore.getState()).toMatchObject({
      autoCheckUpdates: false,
      confirmActions: false,
      density: 'compact',
      enableNotifications: true,
      fontSize: 'large',
      language: 'en-US',
      reduceMotion: true,
      sidebarLabels: 'hide',
      startupView: 'tasks',
      themeMode: 'system',
    })
  })

  it('ignores invalid persisted local preferences and falls back to defaults', async () => {
    bridgeMocks.getSetting.mockResolvedValue('invalid')

    await usePreferenceStore.getState().hydrate()

    expect(usePreferenceStore.getState()).toMatchObject({
      autoCheckUpdates: defaultDesktopPreferences.autoCheckUpdates,
      confirmActions: defaultDesktopPreferences.confirmActions,
      density: defaultDesktopPreferences.density,
      enableNotifications: defaultDesktopPreferences.enableNotifications,
      fontSize: defaultDesktopPreferences.fontSize,
      language: defaultDesktopPreferences.language,
      reduceMotion: defaultDesktopPreferences.reduceMotion,
      sidebarLabels: defaultDesktopPreferences.sidebarLabels,
      startupView: defaultDesktopPreferences.startupView,
      themeMode: defaultDesktopPreferences.themeMode,
    })
  })

  it('persists each new local preference through the Electron settings bridge', async () => {
    bridgeMocks.getSetting.mockResolvedValue(null)
    bridgeMocks.setSetting.mockResolvedValue(true)

    const store = usePreferenceStore.getState()

    await store.setStartupView('code-review')
    await store.setEnableNotifications(false)
    await store.setAutoCheckUpdates(false)
    await store.setConfirmActions(false)
    await store.setDensity('compact')
    await store.setSidebarLabels('hide')
    await store.setFontSize('large')
    await store.setReduceMotion(true)

    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(
      desktopPreferenceKeys.startupView,
      'code-review',
    )
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(
      desktopPreferenceKeys.enableNotifications,
      'false',
    )
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(
      desktopPreferenceKeys.autoCheckUpdates,
      'false',
    )
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(
      desktopPreferenceKeys.confirmActions,
      'false',
    )
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(desktopPreferenceKeys.density, 'compact')
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(desktopPreferenceKeys.sidebarLabels, 'hide')
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(desktopPreferenceKeys.fontSize, 'large')
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(desktopPreferenceKeys.reduceMotion, 'true')
  })
})
