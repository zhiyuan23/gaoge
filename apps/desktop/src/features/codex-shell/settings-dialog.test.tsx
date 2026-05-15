import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { AppProviders } from '@/app/providers/app-providers'
import { desktopPreferenceKeys } from '@/shared/config/preferences'
import { resetPreferenceStore } from '@/state/preferences-store'

import { SettingsDialog } from './settings-dialog'

const bridgeMocks = vi.hoisted(() => ({
  getSetting: vi.fn(async (key: string) => {
    if (key === 'desktop-language') {
      return 'en-US'
    }

    if (key === 'desktop-theme-mode') {
      return 'dark'
    }

    return null
  }),
  setSetting: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/bridges/electron', () => ({
  electronBridge: {
    app: {
      getVersion: vi.fn().mockResolvedValue('1.2.3'),
    },
    db: {
      getSetting: bridgeMocks.getSetting,
      setSetting: bridgeMocks.setSetting,
    },
    shell: {
      openExternal: vi.fn().mockResolvedValue(true),
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

beforeEach(() => {
  resetPreferenceStore()
  bridgeMocks.setSetting.mockClear()
})

test('switches settings sections and shows static fake data', async () => {
  render(
    <AppProviders>
      <SettingsDialog open onClose={vi.fn()} />
    </AppProviders>,
  )

  fireEvent.click(await screen.findByRole('tab', { name: 'Model' }))

  expect(screen.getByText('Default model: GPT-5.4')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: 'Use GPT-5.4' }))

  expect(screen.getByText('This is a static placeholder action.')).toBeInTheDocument()
})

test('persists general and appearance settings from the dialog', async () => {
  render(
    <AppProviders>
      <SettingsDialog open onClose={vi.fn()} />
    </AppProviders>,
  )

  fireEvent.click(await screen.findByRole('radio', { name: 'Tasks' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable notifications' }))
  fireEvent.click(screen.getByRole('tab', { name: 'Appearance' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Light' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Compact' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Large' }))

  await waitFor(() => {
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(desktopPreferenceKeys.startupView, 'tasks')
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(
      desktopPreferenceKeys.enableNotifications,
      'false',
    )
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(desktopPreferenceKeys.themeMode, 'light')
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(desktopPreferenceKeys.density, 'compact')
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith(desktopPreferenceKeys.fontSize, 'large')
  })
})
