import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { resetPreferenceStore } from './state/preferences-store'
import App from './App'

const bridgeMocks = vi.hoisted(() => ({
  getSetting: vi.fn(async (key: string) => {
    if (key === 'desktop-language') {
      return 'en-US'
    }

    if (key === 'desktop-theme-mode') {
      return 'light'
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
  window.history.replaceState(null, '', '/#/')
})

test('renders a Codex-style desktop shell from saved preferences', async () => {
  render(<App />)

  expect(await screen.findByRole('button', { name: 'Chats' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tasks' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Code Review' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Environments' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Workspace placeholder' })).toBeInTheDocument()
  expect(screen.getByText('Ready for your next coding session.')).toBeInTheDocument()
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})

test('switches the right workspace placeholder from the sidebar menu', async () => {
  render(<App />)

  fireEvent.click(await screen.findByRole('button', { name: 'Tasks' }))

  expect(screen.getByRole('heading', { name: 'Tasks' })).toBeInTheDocument()
  expect(screen.getByText('Task automation will appear here later.')).toBeInTheDocument()
})

test('opens the settings dialog from the sidebar footer', async () => {
  render(<App />)

  fireEvent.click(await screen.findByRole('button', { name: 'Settings' }))

  expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Appearance' })).toBeInTheDocument()
})

test('applies local appearance classes to the shell container', async () => {
  bridgeMocks.getSetting.mockImplementation(async (key: string) => {
    if (key === 'desktop-language') {
      return 'en-US'
    }

    if (key === 'desktop-density') {
      return 'compact'
    }

    if (key === 'desktop-font-size') {
      return 'large'
    }

    if (key === 'desktop-reduce-motion') {
      return 'true'
    }

    if (key === 'desktop-sidebar-labels') {
      return 'hide'
    }

    return null
  })

  render(<App />)

  const workspace = await screen.findByRole('region', { name: 'Workspace placeholder' })
  const shell = workspace.closest('.app-density-compact')

  expect(shell).toHaveClass('app-font-large')
  expect(shell).toHaveClass('app-reduce-motion')

  await waitFor(() => {
    expect(screen.queryByText('Local desktop workspace')).not.toBeInTheDocument()
  })
})
