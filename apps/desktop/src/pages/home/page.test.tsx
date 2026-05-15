import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { AppProviders } from '@/app/providers/app-providers'
import { resetPreferenceStore } from '@/state/preferences-store'

import { HomePage } from './page'

const bridgeMocks = vi.hoisted(() => ({
  getSetting: vi.fn(async (key: string) => {
    if (key === 'desktop-language') {
      return 'en-US'
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
})

test('renders the Gaoge shell as the desktop home page', async () => {
  render(
    <AppProviders>
      <HomePage />
    </AppProviders>,
  )

  expect(await screen.findByRole('button', { name: 'Chats' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Workspace placeholder' })).toBeInTheDocument()
})
