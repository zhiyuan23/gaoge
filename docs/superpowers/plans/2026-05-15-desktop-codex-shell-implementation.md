# Desktop Codex Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `apps/desktop` renderer with a Codex-style two-column static shell and a local, interactive settings dialog.

**Architecture:** Keep the existing Electron main/preload/runtime bridge intact. Replace the renderer shell with focused React components, extend the existing `preferences-store` for local settings, and keep all real-business surfaces as static menu-driven empty states.

**Tech Stack:** Electron, React 19, TypeScript, React Router, Zustand, Tailwind CSS 4, Vitest, Testing Library, Playwright.

---

## File Structure

- Modify `apps/desktop/src/shared/config/preferences.ts`
  - Owns preference types, default values, local setting keys, and runtime validators.
- Modify `apps/desktop/src/state/preferences-store.ts`
  - Hydrates all local UI preferences through `electronBridge.db`.
  - Exposes setters used by the settings dialog and shell.
- Create `apps/desktop/src/state/preferences-store.test.ts`
  - Covers hydrate fallback, persisted hydrate, and setter writes for new local options.
- Modify `apps/desktop/src/shared/i18n/messages.ts`
  - Replace old home/settings copy with Codex-shell copy for Chinese and English.
- Create `apps/desktop/src/features/codex-shell/shell-options.ts`
  - Defines menu items, setting sections, static model/account/integration rows, and status labels.
- Create `apps/desktop/src/features/codex-shell/sidebar.tsx`
  - Renders left navigation and bottom settings button.
- Create `apps/desktop/src/features/codex-shell/workspace-placeholder.tsx`
  - Renders the right blank workspace state for the selected menu.
- Create `apps/desktop/src/features/codex-shell/settings-dialog.tsx`
  - Renders the modal, setting section tabs, local preference controls, and fake interactive controls.
- Modify `apps/desktop/src/app/layout/app-shell.tsx`
  - Replaces the existing high-level shell with the Codex shell composition.
- Modify `apps/desktop/src/app/router/index.tsx`
  - Route `/` to the new shell and redirect `/settings` to `/`.
- Delete `apps/desktop/src/pages/home/page.tsx`
  - No longer used; the shell owns the first screen.
- Delete `apps/desktop/src/pages/settings/page.tsx`
  - No longer used; settings are a modal.
- Modify `apps/desktop/src/App.test.tsx`
  - Covers full-shell rendering, menu switching, and opening settings.
- Modify `apps/desktop/src/pages/home/page.test.tsx`
  - Replace with a test file for the workspace component, or delete if coverage is moved to `App.test.tsx`.
- Modify `apps/desktop/src/pages/settings/page.test.tsx`
  - Replace with dialog tests under the new feature path, or delete after equivalent coverage exists.
- Create `apps/desktop/src/features/codex-shell/settings-dialog.test.tsx`
  - Covers section switching, local preference writes, and fake controls.
- Modify `apps/desktop/src/shared/styles/app.css`
  - Replace current high-gloss Gaoge desktop visuals with neutral Codex-style variables and app-level preference classes.
- Modify `apps/desktop/e2e/app.spec.ts`
  - Update smoke expectation from `高歌桌面版` to the new shell text.

## Task 1: Extend Local Preferences

**Files:**

- Modify: `apps/desktop/src/shared/config/preferences.ts`
- Modify: `apps/desktop/src/state/preferences-store.ts`
- Create: `apps/desktop/src/state/preferences-store.test.ts`

- [ ] **Step 1: Write failing preference-store tests**

Create `apps/desktop/src/state/preferences-store.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { defaultDesktopPreferences, desktopPreferenceKeys } from '@/shared/config/preferences'

import { resetPreferenceStore, usePreferenceStore } from './preferences-store'

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

  it('hydrates persisted local preferences and ignores invalid values', async () => {
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
```

- [ ] **Step 2: Run the failing preference-store tests**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/state/preferences-store.test.ts
```

Expected: FAIL because `defaultDesktopPreferences`, new preference types, and new store setters do not exist yet.

- [ ] **Step 3: Replace preference config with complete local preference definitions**

Replace `apps/desktop/src/shared/config/preferences.ts` with:

```ts
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
```

- [ ] **Step 4: Replace the preference store with full hydrate/setter support**

Replace `apps/desktop/src/state/preferences-store.ts` with:

```ts
import { create } from 'zustand'

import { electronBridge } from '@/bridges/electron'
import {
  defaultDesktopPreferences,
  desktopPreferenceKeys,
  getSystemPrefersDark,
  isDensity,
  isFontSize,
  isLanguage,
  isShellMenuKey,
  isSidebarLabels,
  isThemeMode,
  parseBooleanPreference,
  resolveTheme,
  serializeBooleanPreference,
  type Density,
  type FontSize,
  type Language,
  type ResolvedTheme,
  type ShellMenuKey,
  type SidebarLabels,
  type ThemeMode,
} from '@/shared/config/preferences'

interface PreferenceState {
  autoCheckUpdates: boolean
  confirmActions: boolean
  density: Density
  enableNotifications: boolean
  fontSize: FontSize
  hydrated: boolean
  language: Language
  reduceMotion: boolean
  resolvedTheme: ResolvedTheme
  sidebarLabels: SidebarLabels
  startupView: ShellMenuKey
  themeMode: ThemeMode
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

async function setStringPreference(key: string, value: string) {
  await electronBridge.db.setSetting(key, value)
}

async function setBooleanPreference(key: string, value: boolean) {
  await setStringPreference(key, serializeBooleanPreference(value))
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  ...getDefaultState(),
  async hydrate() {
    if (get().hydrated) {
      return
    }

    const [
      savedThemeMode,
      savedLanguage,
      savedStartupView,
      savedEnableNotifications,
      savedAutoCheckUpdates,
      savedConfirmActions,
      savedDensity,
      savedSidebarLabels,
      savedFontSize,
      savedReduceMotion,
    ] = await Promise.all([
      electronBridge.db.getSetting(desktopPreferenceKeys.themeMode),
      electronBridge.db.getSetting(desktopPreferenceKeys.language),
      electronBridge.db.getSetting(desktopPreferenceKeys.startupView),
      electronBridge.db.getSetting(desktopPreferenceKeys.enableNotifications),
      electronBridge.db.getSetting(desktopPreferenceKeys.autoCheckUpdates),
      electronBridge.db.getSetting(desktopPreferenceKeys.confirmActions),
      electronBridge.db.getSetting(desktopPreferenceKeys.density),
      electronBridge.db.getSetting(desktopPreferenceKeys.sidebarLabels),
      electronBridge.db.getSetting(desktopPreferenceKeys.fontSize),
      electronBridge.db.getSetting(desktopPreferenceKeys.reduceMotion),
    ])

    const themeMode = isThemeMode(savedThemeMode)
      ? savedThemeMode
      : defaultDesktopPreferences.themeMode
    const language = isLanguage(savedLanguage) ? savedLanguage : defaultDesktopPreferences.language

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
      language,
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
    await setBooleanPreference(desktopPreferenceKeys.autoCheckUpdates, autoCheckUpdates)
  },
  async setConfirmActions(confirmActions) {
    set({ confirmActions })
    await setBooleanPreference(desktopPreferenceKeys.confirmActions, confirmActions)
  },
  async setDensity(density) {
    set({ density })
    await setStringPreference(desktopPreferenceKeys.density, density)
  },
  async setEnableNotifications(enableNotifications) {
    set({ enableNotifications })
    await setBooleanPreference(desktopPreferenceKeys.enableNotifications, enableNotifications)
  },
  async setFontSize(fontSize) {
    set({ fontSize })
    await setStringPreference(desktopPreferenceKeys.fontSize, fontSize)
  },
  async setLanguage(language) {
    set({ language })
    await setStringPreference(desktopPreferenceKeys.language, language)
  },
  async setReduceMotion(reduceMotion) {
    set({ reduceMotion })
    await setBooleanPreference(desktopPreferenceKeys.reduceMotion, reduceMotion)
  },
  async setSidebarLabels(sidebarLabels) {
    set({ sidebarLabels })
    await setStringPreference(desktopPreferenceKeys.sidebarLabels, sidebarLabels)
  },
  async setStartupView(startupView) {
    set({ startupView })
    await setStringPreference(desktopPreferenceKeys.startupView, startupView)
  },
  async setThemeMode(themeMode) {
    set({
      resolvedTheme: resolveTheme(themeMode, getSystemPrefersDark()),
      themeMode,
    })
    await setStringPreference(desktopPreferenceKeys.themeMode, themeMode)
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
```

- [ ] **Step 5: Run preference-store tests**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/state/preferences-store.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add apps/desktop/src/shared/config/preferences.ts apps/desktop/src/state/preferences-store.ts apps/desktop/src/state/preferences-store.test.ts
git commit -m "feat: extend desktop preferences"
```

## Task 2: Add Codex Shell Sidebar and Workspace

**Files:**

- Modify: `apps/desktop/src/App.test.tsx`
- Modify: `apps/desktop/src/shared/i18n/messages.ts`
- Create: `apps/desktop/src/features/codex-shell/shell-options.ts`
- Create: `apps/desktop/src/features/codex-shell/sidebar.tsx`
- Create: `apps/desktop/src/features/codex-shell/workspace-placeholder.tsx`
- Modify: `apps/desktop/src/app/layout/app-shell.tsx`

- [ ] **Step 1: Replace the app shell test with Codex shell behavior**

Replace `apps/desktop/src/App.test.tsx` with:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
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
  window.location.hash = '#/'
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
```

- [ ] **Step 2: Run the failing app shell tests**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/App.test.tsx
```

Expected: FAIL because the current shell still renders the old Gaoge layout.

- [ ] **Step 3: Replace i18n messages with Codex shell copy**

Replace `apps/desktop/src/shared/i18n/messages.ts` with a reduced set of active renderer messages:

```ts
import type { Language } from '@/shared/config/preferences'

const zhCN = {
  'shell.brand.title': 'Codex',
  'shell.brand.subtitle': '本地桌面工作区',
  'shell.menu.chats': 'Chats',
  'shell.menu.tasks': 'Tasks',
  'shell.menu.codeReview': 'Code Review',
  'shell.menu.environments': 'Environments',
  'shell.settings': 'Settings',
  'shell.workspace.label': 'Workspace placeholder',
  'shell.workspace.chats.title': 'Chats',
  'shell.workspace.chats.description': 'Ready for your next coding session.',
  'shell.workspace.chats.empty': '聊天与代码任务入口后续会显示在这里。',
  'shell.workspace.tasks.title': 'Tasks',
  'shell.workspace.tasks.description': 'Task automation will appear here later.',
  'shell.workspace.tasks.empty': '任务列表当前使用静态占位。',
  'shell.workspace.codeReview.title': 'Code Review',
  'shell.workspace.codeReview.description': 'Review workflows will appear here later.',
  'shell.workspace.codeReview.empty': '代码审查功能暂不接入真实仓库。',
  'shell.workspace.environments.title': 'Environments',
  'shell.workspace.environments.description': 'Runtime environments will appear here later.',
  'shell.workspace.environments.empty': '环境管理当前只保留入口。',
  'settings.title': 'Settings',
  'settings.close': '关闭设置',
  'settings.status.idle': '设置已准备就绪。',
  'settings.status.saved': '本地设置已保存。',
  'settings.status.fakeAction': '这是静态占位操作。',
  'settings.section.general': 'General',
  'settings.section.appearance': 'Appearance',
  'settings.section.account': 'Account',
  'settings.section.model': 'Model',
  'settings.section.integrations': 'Integrations',
  'settings.section.advanced': 'Advanced',
  'settings.language.title': 'Interface language',
  'settings.language.zh-CN': '简体中文',
  'settings.language.en-US': 'English',
  'settings.startup.title': 'Startup view',
  'settings.theme.title': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.density.title': 'Density',
  'settings.density.comfortable': 'Comfortable',
  'settings.density.compact': 'Compact',
  'settings.sidebarLabels.title': 'Sidebar labels',
  'settings.sidebarLabels.show': 'Show',
  'settings.sidebarLabels.hide': 'Hide',
  'settings.fontSize.title': 'Font size',
  'settings.fontSize.small': 'Small',
  'settings.fontSize.default': 'Default',
  'settings.fontSize.large': 'Large',
  'settings.toggle.notifications': 'Enable notifications',
  'settings.toggle.autoUpdates': 'Check for updates automatically',
  'settings.toggle.confirmActions': 'Confirm before running actions',
  'settings.toggle.reduceMotion': 'Reduce motion',
  'settings.fake.account': 'Signed in as alex@example.test',
  'settings.fake.model': 'Default model: GPT-5.4',
  'settings.fake.integrations': 'GitHub, Figma, and Notion use local sample states.',
  'settings.fake.advanced': 'Developer diagnostics are static in this build.',
} as const

const enUS = {
  'shell.brand.title': 'Codex',
  'shell.brand.subtitle': 'Local desktop workspace',
  'shell.menu.chats': 'Chats',
  'shell.menu.tasks': 'Tasks',
  'shell.menu.codeReview': 'Code Review',
  'shell.menu.environments': 'Environments',
  'shell.settings': 'Settings',
  'shell.workspace.label': 'Workspace placeholder',
  'shell.workspace.chats.title': 'Chats',
  'shell.workspace.chats.description': 'Ready for your next coding session.',
  'shell.workspace.chats.empty': 'Chat and coding task surfaces will appear here later.',
  'shell.workspace.tasks.title': 'Tasks',
  'shell.workspace.tasks.description': 'Task automation will appear here later.',
  'shell.workspace.tasks.empty': 'The task list is intentionally static for now.',
  'shell.workspace.codeReview.title': 'Code Review',
  'shell.workspace.codeReview.description': 'Review workflows will appear here later.',
  'shell.workspace.codeReview.empty': 'Code review is not connected to real repositories yet.',
  'shell.workspace.environments.title': 'Environments',
  'shell.workspace.environments.description': 'Runtime environments will appear here later.',
  'shell.workspace.environments.empty': 'Environment management keeps only its entry point now.',
  'settings.title': 'Settings',
  'settings.close': 'Close settings',
  'settings.status.idle': 'Settings are ready.',
  'settings.status.saved': 'Local setting saved.',
  'settings.status.fakeAction': 'This is a static placeholder action.',
  'settings.section.general': 'General',
  'settings.section.appearance': 'Appearance',
  'settings.section.account': 'Account',
  'settings.section.model': 'Model',
  'settings.section.integrations': 'Integrations',
  'settings.section.advanced': 'Advanced',
  'settings.language.title': 'Interface language',
  'settings.language.zh-CN': 'Simplified Chinese',
  'settings.language.en-US': 'English',
  'settings.startup.title': 'Startup view',
  'settings.theme.title': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.density.title': 'Density',
  'settings.density.comfortable': 'Comfortable',
  'settings.density.compact': 'Compact',
  'settings.sidebarLabels.title': 'Sidebar labels',
  'settings.sidebarLabels.show': 'Show',
  'settings.sidebarLabels.hide': 'Hide',
  'settings.fontSize.title': 'Font size',
  'settings.fontSize.small': 'Small',
  'settings.fontSize.default': 'Default',
  'settings.fontSize.large': 'Large',
  'settings.toggle.notifications': 'Enable notifications',
  'settings.toggle.autoUpdates': 'Check for updates automatically',
  'settings.toggle.confirmActions': 'Confirm before running actions',
  'settings.toggle.reduceMotion': 'Reduce motion',
  'settings.fake.account': 'Signed in as alex@example.test',
  'settings.fake.model': 'Default model: GPT-5.4',
  'settings.fake.integrations': 'GitHub, Figma, and Notion use local sample states.',
  'settings.fake.advanced': 'Developer diagnostics are static in this build.',
} as const

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const

export type MessageKey = keyof typeof zhCN

export function getMessage(language: Language, key: MessageKey): string {
  return messages[language][key]
}
```

- [ ] **Step 4: Create shared shell option definitions**

Create `apps/desktop/src/features/codex-shell/shell-options.ts`:

```ts
import type { MessageKey } from '@/shared/i18n/messages'
import type { ShellMenuKey } from '@/shared/config/preferences'

export interface ShellMenuItem {
  descriptionKey: MessageKey
  key: ShellMenuKey
  labelKey: MessageKey
}

export const shellMenuItems: ShellMenuItem[] = [
  {
    descriptionKey: 'shell.workspace.chats.description',
    key: 'chats',
    labelKey: 'shell.menu.chats',
  },
  {
    descriptionKey: 'shell.workspace.tasks.description',
    key: 'tasks',
    labelKey: 'shell.menu.tasks',
  },
  {
    descriptionKey: 'shell.workspace.codeReview.description',
    key: 'code-review',
    labelKey: 'shell.menu.codeReview',
  },
  {
    descriptionKey: 'shell.workspace.environments.description',
    key: 'environments',
    labelKey: 'shell.menu.environments',
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
  tasks: {
    descriptionKey: 'shell.workspace.tasks.description',
    emptyKey: 'shell.workspace.tasks.empty',
    titleKey: 'shell.workspace.tasks.title',
  },
}
```

- [ ] **Step 5: Create the sidebar component**

Create `apps/desktop/src/features/codex-shell/sidebar.tsx`:

```tsx
import type { ShellMenuKey, SidebarLabels } from '@/shared/config/preferences'
import { useTranslation } from '@/shared/i18n/use-translation'

import { shellMenuItems } from './shell-options'

interface SidebarProps {
  activeMenu: ShellMenuKey
  labels: SidebarLabels
  onOpenSettings(): void
  onSelectMenu(menu: ShellMenuKey): void
}

export function Sidebar({ activeMenu, labels, onOpenSettings, onSelectMenu }: SidebarProps) {
  const { t } = useTranslation()
  const showLabels = labels === 'show'

  return (
    <aside className="app-no-drag flex h-screen w-[248px] shrink-0 flex-col border-r border-[color:var(--border-soft)] bg-[color:var(--sidebar-bg)] px-3 py-3">
      <div className="app-drag-region mb-3 flex h-11 items-center gap-2 px-2">
        <div className="app-no-drag flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--border-soft)] bg-[color:var(--control-bg)] text-xs font-semibold">
          C
        </div>
        {showLabels ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">
              {t('shell.brand.title')}
            </p>
            <p className="truncate text-xs text-[color:var(--text-muted)]">
              {t('shell.brand.subtitle')}
            </p>
          </div>
        ) : null}
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {shellMenuItems.map((item) => {
          const isActive = item.key === activeMenu

          return (
            <button
              aria-pressed={isActive}
              className={[
                'flex h-9 items-center rounded-md px-2 text-left text-sm transition-colors',
                isActive
                  ? 'bg-[color:var(--control-active-bg)] text-[color:var(--text-primary)]'
                  : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--control-hover-bg)] hover:text-[color:var(--text-primary)]',
              ].join(' ')}
              key={item.key}
              onClick={() => onSelectMenu(item.key)}
              type="button"
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-xs">
                {t(item.labelKey).slice(0, 1)}
              </span>
              {showLabels ? <span className="ml-2 truncate">{t(item.labelKey)}</span> : null}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-[color:var(--border-soft)] pt-2">
        <button
          className="flex h-9 w-full items-center rounded-md px-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--control-hover-bg)] hover:text-[color:var(--text-primary)]"
          onClick={onOpenSettings}
          type="button"
        >
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-xs">
            S
          </span>
          {showLabels ? <span className="ml-2 truncate">{t('shell.settings')}</span> : null}
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Create the workspace placeholder component**

Create `apps/desktop/src/features/codex-shell/workspace-placeholder.tsx`:

```tsx
import type { ShellMenuKey } from '@/shared/config/preferences'
import { useTranslation } from '@/shared/i18n/use-translation'

import { workspaceCopy } from './shell-options'

interface WorkspacePlaceholderProps {
  activeMenu: ShellMenuKey
}

export function WorkspacePlaceholder({ activeMenu }: WorkspacePlaceholderProps) {
  const { t } = useTranslation()
  const copy = workspaceCopy[activeMenu]

  return (
    <section
      aria-label={t('shell.workspace.label')}
      className="app-drag-region flex min-h-screen flex-1 flex-col bg-[color:var(--workspace-bg)]"
    >
      <header className="flex h-14 items-center border-b border-[color:var(--border-soft)] px-5">
        <h1 className="text-sm font-medium text-[color:var(--text-primary)]">{t(copy.titleKey)}</h1>
      </header>
      <div className="app-no-drag flex flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-[color:var(--text-primary)]">
            {t(copy.descriptionKey)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
            {t(copy.emptyKey)}
          </p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Replace AppShell with the Codex shell composition**

Replace `apps/desktop/src/app/layout/app-shell.tsx` with:

```tsx
import { useState } from 'react'

import { Sidebar } from '@/features/codex-shell/sidebar'
import { WorkspacePlaceholder } from '@/features/codex-shell/workspace-placeholder'
import type { ShellMenuKey } from '@/shared/config/preferences'
import { usePreferenceStore } from '@/state/preferences-store'

export function AppShell() {
  const density = usePreferenceStore((state) => state.density)
  const fontSize = usePreferenceStore((state) => state.fontSize)
  const reduceMotion = usePreferenceStore((state) => state.reduceMotion)
  const sidebarLabels = usePreferenceStore((state) => state.sidebarLabels)
  const startupView = usePreferenceStore((state) => state.startupView)
  const [activeMenu, setActiveMenu] = useState<ShellMenuKey>(startupView)

  return (
    <div
      className={[
        'min-h-screen bg-[color:var(--app-bg)] text-[color:var(--text-primary)]',
        density === 'compact' ? 'app-density-compact' : 'app-density-comfortable',
        fontSize === 'small' ? 'app-font-small' : '',
        fontSize === 'large' ? 'app-font-large' : '',
        reduceMotion ? 'app-reduce-motion' : '',
      ].join(' ')}
    >
      <div className="flex min-h-screen overflow-hidden">
        <Sidebar
          activeMenu={activeMenu}
          labels={sidebarLabels}
          onOpenSettings={() => undefined}
          onSelectMenu={setActiveMenu}
        />
        <WorkspacePlaceholder activeMenu={activeMenu} />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Run app shell tests**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/App.test.tsx
```

Expected: PASS for rendering and menu switching. The Settings button is visible but does not open a dialog until Task 3.

- [ ] **Step 9: Commit Task 2**

Run:

```bash
git add apps/desktop/src/App.test.tsx apps/desktop/src/shared/i18n/messages.ts apps/desktop/src/features/codex-shell/shell-options.ts apps/desktop/src/features/codex-shell/sidebar.tsx apps/desktop/src/features/codex-shell/workspace-placeholder.tsx apps/desktop/src/app/layout/app-shell.tsx
git commit -m "feat: add codex desktop shell"
```

## Task 3: Implement the Settings Dialog

**Files:**

- Create: `apps/desktop/src/features/codex-shell/settings-dialog.test.tsx`
- Modify: `apps/desktop/src/features/codex-shell/shell-options.ts`
- Create: `apps/desktop/src/features/codex-shell/settings-dialog.tsx`
- Modify: `apps/desktop/src/app/layout/app-shell.tsx`

- [ ] **Step 1: Write failing settings dialog tests**

Create `apps/desktop/src/features/codex-shell/settings-dialog.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the failing settings dialog tests**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/features/codex-shell/settings-dialog.test.tsx
```

Expected: FAIL because `SettingsDialog` does not exist yet.

- [ ] **Step 3: Extend shell options with settings sections**

Append to `apps/desktop/src/features/codex-shell/shell-options.ts`:

```ts
export type SettingsSectionKey =
  | 'general'
  | 'appearance'
  | 'account'
  | 'model'
  | 'integrations'
  | 'advanced'

export const settingsSections: Array<{
  key: SettingsSectionKey
  labelKey: MessageKey
}> = [
  { key: 'general', labelKey: 'settings.section.general' },
  { key: 'appearance', labelKey: 'settings.section.appearance' },
  { key: 'account', labelKey: 'settings.section.account' },
  { key: 'model', labelKey: 'settings.section.model' },
  { key: 'integrations', labelKey: 'settings.section.integrations' },
  { key: 'advanced', labelKey: 'settings.section.advanced' },
]
```

- [ ] **Step 4: Create the settings dialog**

Create `apps/desktop/src/features/codex-shell/settings-dialog.tsx`:

```tsx
import { useState } from 'react'

import type {
  Density,
  FontSize,
  Language,
  ShellMenuKey,
  SidebarLabels,
  ThemeMode,
} from '@/shared/config/preferences'
import { useTranslation } from '@/shared/i18n/use-translation'
import { usePreferenceStore } from '@/state/preferences-store'

import { settingsSections, shellMenuItems, type SettingsSectionKey } from './shell-options'

interface SettingsDialogProps {
  open: boolean
  onClose(): void
}

type StatusKey = 'settings.status.idle' | 'settings.status.saved' | 'settings.status.fakeAction'

const languageOptions: Array<{
  labelKey: 'settings.language.zh-CN' | 'settings.language.en-US'
  value: Language
}> = [
  { labelKey: 'settings.language.zh-CN', value: 'zh-CN' },
  { labelKey: 'settings.language.en-US', value: 'en-US' },
]

const themeOptions: Array<{
  labelKey: 'settings.theme.light' | 'settings.theme.dark' | 'settings.theme.system'
  value: ThemeMode
}> = [
  { labelKey: 'settings.theme.light', value: 'light' },
  { labelKey: 'settings.theme.dark', value: 'dark' },
  { labelKey: 'settings.theme.system', value: 'system' },
]

const densityOptions: Array<{
  labelKey: 'settings.density.comfortable' | 'settings.density.compact'
  value: Density
}> = [
  { labelKey: 'settings.density.comfortable', value: 'comfortable' },
  { labelKey: 'settings.density.compact', value: 'compact' },
]

const sidebarLabelOptions: Array<{
  labelKey: 'settings.sidebarLabels.show' | 'settings.sidebarLabels.hide'
  value: SidebarLabels
}> = [
  { labelKey: 'settings.sidebarLabels.show', value: 'show' },
  { labelKey: 'settings.sidebarLabels.hide', value: 'hide' },
]

const fontSizeOptions: Array<{
  labelKey: 'settings.fontSize.small' | 'settings.fontSize.default' | 'settings.fontSize.large'
  value: FontSize
}> = [
  { labelKey: 'settings.fontSize.small', value: 'small' },
  { labelKey: 'settings.fontSize.default', value: 'default' },
  { labelKey: 'settings.fontSize.large', value: 'large' },
]

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('general')
  const [statusKey, setStatusKey] = useState<StatusKey>('settings.status.idle')
  const [githubConnected, setGithubConnected] = useState(false)
  const preferences = usePreferenceStore()

  if (!open) {
    return null
  }

  async function savePreference(action: Promise<void>) {
    await action
    setStatusKey('settings.status.saved')
  }

  function handleFakeAction() {
    setGithubConnected((value) => !value)
    setStatusKey('settings.status.fakeAction')
  }

  return (
    <div className="app-no-drag bg-black/38 fixed inset-0 z-50 flex items-center justify-center px-6 py-8">
      <section
        aria-labelledby="settings-dialog-title"
        aria-modal="true"
        className="grid h-[min(720px,calc(100vh-64px))] w-[min(920px,calc(100vw-48px))] grid-cols-[220px_minmax(0,1fr)] overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--modal-bg)] shadow-[0_24px_80px_rgb(0_0_0/28%)]"
        role="dialog"
      >
        <aside className="border-r border-[color:var(--border-soft)] bg-[color:var(--sidebar-bg)] p-3">
          <div className="mb-3 flex items-center justify-between px-2">
            <h2 className="text-sm font-medium" id="settings-dialog-title">
              {t('settings.title')}
            </h2>
            <button
              aria-label={t('settings.close')}
              className="rounded-md px-2 py-1 text-sm text-[color:var(--text-secondary)] hover:bg-[color:var(--control-hover-bg)]"
              onClick={onClose}
              type="button"
            >
              x
            </button>
          </div>
          <div aria-label={t('settings.title')} className="flex flex-col gap-1" role="tablist">
            {settingsSections.map((section) => (
              <button
                aria-selected={activeSection === section.key}
                className={[
                  'rounded-md px-2 py-2 text-left text-sm',
                  activeSection === section.key
                    ? 'bg-[color:var(--control-active-bg)] text-[color:var(--text-primary)]'
                    : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--control-hover-bg)]',
                ].join(' ')}
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                role="tab"
                type="button"
              >
                {t(section.labelKey)}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {activeSection === 'general' ? (
              <div className="grid gap-6">
                <RadioGroup
                  label={t('settings.language.title')}
                  name="language"
                  options={languageOptions.map((option) => ({
                    label: t(option.labelKey),
                    value: option.value,
                  }))}
                  value={preferences.language}
                  onChange={(value) =>
                    void savePreference(preferences.setLanguage(value as Language))
                  }
                />
                <RadioGroup
                  label={t('settings.startup.title')}
                  name="startup-view"
                  options={shellMenuItems.map((item) => ({
                    label: t(item.labelKey),
                    value: item.key,
                  }))}
                  value={preferences.startupView}
                  onChange={(value) =>
                    void savePreference(preferences.setStartupView(value as ShellMenuKey))
                  }
                />
                <ToggleRow
                  checked={preferences.enableNotifications}
                  label={t('settings.toggle.notifications')}
                  onChange={(checked) =>
                    void savePreference(preferences.setEnableNotifications(checked))
                  }
                />
                <ToggleRow
                  checked={preferences.autoCheckUpdates}
                  label={t('settings.toggle.autoUpdates')}
                  onChange={(checked) =>
                    void savePreference(preferences.setAutoCheckUpdates(checked))
                  }
                />
                <ToggleRow
                  checked={preferences.confirmActions}
                  label={t('settings.toggle.confirmActions')}
                  onChange={(checked) =>
                    void savePreference(preferences.setConfirmActions(checked))
                  }
                />
              </div>
            ) : null}

            {activeSection === 'appearance' ? (
              <div className="grid gap-6">
                <RadioGroup
                  label={t('settings.theme.title')}
                  name="theme"
                  options={themeOptions.map((option) => ({
                    label: t(option.labelKey),
                    value: option.value,
                  }))}
                  value={preferences.themeMode}
                  onChange={(value) =>
                    void savePreference(preferences.setThemeMode(value as ThemeMode))
                  }
                />
                <RadioGroup
                  label={t('settings.density.title')}
                  name="density"
                  options={densityOptions.map((option) => ({
                    label: t(option.labelKey),
                    value: option.value,
                  }))}
                  value={preferences.density}
                  onChange={(value) =>
                    void savePreference(preferences.setDensity(value as Density))
                  }
                />
                <RadioGroup
                  label={t('settings.sidebarLabels.title')}
                  name="sidebar-labels"
                  options={sidebarLabelOptions.map((option) => ({
                    label: t(option.labelKey),
                    value: option.value,
                  }))}
                  value={preferences.sidebarLabels}
                  onChange={(value) =>
                    void savePreference(preferences.setSidebarLabels(value as SidebarLabels))
                  }
                />
                <RadioGroup
                  label={t('settings.fontSize.title')}
                  name="font-size"
                  options={fontSizeOptions.map((option) => ({
                    label: t(option.labelKey),
                    value: option.value,
                  }))}
                  value={preferences.fontSize}
                  onChange={(value) =>
                    void savePreference(preferences.setFontSize(value as FontSize))
                  }
                />
                <ToggleRow
                  checked={preferences.reduceMotion}
                  label={t('settings.toggle.reduceMotion')}
                  onChange={(checked) => void savePreference(preferences.setReduceMotion(checked))}
                />
              </div>
            ) : null}

            {activeSection === 'account' ? (
              <FakePanel body={t('settings.fake.account')} onAction={handleFakeAction} />
            ) : null}
            {activeSection === 'model' ? (
              <FakePanel
                actionLabel="Use GPT-5.4"
                body={t('settings.fake.model')}
                onAction={handleFakeAction}
              />
            ) : null}
            {activeSection === 'integrations' ? (
              <FakePanel
                actionLabel={githubConnected ? 'Disconnect GitHub' : 'Connect GitHub'}
                body={t('settings.fake.integrations')}
                onAction={handleFakeAction}
              />
            ) : null}
            {activeSection === 'advanced' ? (
              <FakePanel body={t('settings.fake.advanced')} onAction={handleFakeAction} />
            ) : null}
          </div>
          <footer className="border-t border-[color:var(--border-soft)] px-6 py-3 text-sm text-[color:var(--text-muted)]">
            {t(statusKey)}
          </footer>
        </div>
      </section>
    </div>
  )
}

interface RadioGroupProps {
  label: string
  name: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange(value: string): void
}

function RadioGroup({ label, name, onChange, options, value }: RadioGroupProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-[color:var(--text-primary)]">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            className="flex cursor-pointer items-center gap-2 rounded-md border border-[color:var(--border-soft)] px-3 py-2 text-sm"
            key={option.value}
          >
            <input
              checked={value === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface ToggleRowProps {
  checked: boolean
  label: string
  onChange(checked: boolean): void
}

function ToggleRow({ checked, label, onChange }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-[color:var(--border-soft)] px-3 py-2 text-sm">
      <span>{label}</span>
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

interface FakePanelProps {
  actionLabel?: string
  body: string
  onAction(): void
}

function FakePanel({ actionLabel = 'Run action', body, onAction }: FakePanelProps) {
  return (
    <div className="rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--panel-bg)] p-4">
      <p className="text-sm text-[color:var(--text-secondary)]">{body}</p>
      <button
        className="mt-4 rounded-md border border-[color:var(--border-soft)] px-3 py-2 text-sm hover:bg-[color:var(--control-hover-bg)]"
        onClick={onAction}
        type="button"
      >
        {actionLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Wire the dialog into AppShell**

Update `apps/desktop/src/app/layout/app-shell.tsx` to import and render the dialog:

```tsx
import { useEffect, useState } from 'react'

import { SettingsDialog } from '@/features/codex-shell/settings-dialog'
import { Sidebar } from '@/features/codex-shell/sidebar'
import { WorkspacePlaceholder } from '@/features/codex-shell/workspace-placeholder'
import type { ShellMenuKey } from '@/shared/config/preferences'
import { usePreferenceStore } from '@/state/preferences-store'

export function AppShell() {
  const density = usePreferenceStore((state) => state.density)
  const fontSize = usePreferenceStore((state) => state.fontSize)
  const reduceMotion = usePreferenceStore((state) => state.reduceMotion)
  const sidebarLabels = usePreferenceStore((state) => state.sidebarLabels)
  const startupView = usePreferenceStore((state) => state.startupView)
  const [activeMenu, setActiveMenu] = useState<ShellMenuKey>(startupView)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    setActiveMenu(startupView)
  }, [startupView])

  return (
    <div
      className={[
        'min-h-screen bg-[color:var(--app-bg)] text-[color:var(--text-primary)]',
        density === 'compact' ? 'app-density-compact' : 'app-density-comfortable',
        fontSize === 'small' ? 'app-font-small' : '',
        fontSize === 'large' ? 'app-font-large' : '',
        reduceMotion ? 'app-reduce-motion' : '',
      ].join(' ')}
    >
      <div className="flex min-h-screen overflow-hidden">
        <Sidebar
          activeMenu={activeMenu}
          labels={sidebarLabels}
          onOpenSettings={() => setSettingsOpen(true)}
          onSelectMenu={setActiveMenu}
        />
        <WorkspacePlaceholder activeMenu={activeMenu} />
      </div>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 6: Add an app-level test for opening settings**

Append this test to `apps/desktop/src/App.test.tsx`:

```tsx
test('opens the settings dialog from the sidebar footer', async () => {
  render(<App />)

  fireEvent.click(await screen.findByRole('button', { name: 'Settings' }))

  expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Appearance' })).toBeInTheDocument()
})
```

- [ ] **Step 7: Run dialog and app tests**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/features/codex-shell/settings-dialog.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

Run:

```bash
git add apps/desktop/src/features/codex-shell/settings-dialog.test.tsx apps/desktop/src/features/codex-shell/shell-options.ts apps/desktop/src/features/codex-shell/settings-dialog.tsx apps/desktop/src/app/layout/app-shell.tsx apps/desktop/src/App.test.tsx
git commit -m "feat: add desktop settings dialog"
```

## Task 4: Clean Up Routes and Old Pages

**Files:**

- Modify: `apps/desktop/src/app/router/index.tsx`
- Delete: `apps/desktop/src/pages/home/page.tsx`
- Delete: `apps/desktop/src/pages/home/page.test.tsx`
- Delete: `apps/desktop/src/pages/settings/page.tsx`
- Delete: `apps/desktop/src/pages/settings/page.test.tsx`

- [ ] **Step 1: Run router-related search before cleanup**

Run:

```bash
rg -n "HomePage|SettingsPage|pages/home|pages/settings|/settings" apps/desktop/src
```

Expected: current router and old tests still reference old pages.

- [ ] **Step 2: Replace router with shell-only route and `/settings` redirect**

Replace `apps/desktop/src/app/router/index.tsx` with:

```tsx
import { Navigate, createHashRouter } from 'react-router-dom'

import { AppShell } from '@/app/layout/app-shell'

export const appRouter = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
  },
  {
    path: '/settings',
    element: <Navigate replace to="/" />,
  },
])
```

- [ ] **Step 3: Delete obsolete page files**

Use `apply_patch` delete hunks for these files:

```text
*** Begin Patch
*** Delete File: apps/desktop/src/pages/home/page.tsx
*** Delete File: apps/desktop/src/pages/home/page.test.tsx
*** Delete File: apps/desktop/src/pages/settings/page.tsx
*** Delete File: apps/desktop/src/pages/settings/page.test.tsx
*** End Patch
```

- [ ] **Step 4: Verify old page references are gone**

Run:

```bash
rg -n "HomePage|SettingsPage|pages/home|pages/settings" apps/desktop/src
```

Expected: no matches.

- [ ] **Step 5: Run app tests after route cleanup**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add apps/desktop/src/app/router/index.tsx
git add -u apps/desktop/src/pages/home apps/desktop/src/pages/settings
git commit -m "refactor: remove old desktop pages"
```

## Task 5: Apply Codex-Style Visual System

**Files:**

- Modify: `apps/desktop/src/shared/styles/app.css`

- [ ] **Step 1: Add a visual regression-oriented assertion to App.test**

First update the import in `apps/desktop/src/App.test.tsx` so it includes `waitFor`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
```

Then append this test:

```tsx
test('applies local appearance classes to the shell container', async () => {
  bridgeMocks.getSetting.mockImplementation(async (key: string) => {
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
```

- [ ] **Step 2: Run the appearance test**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/App.test.tsx
```

Expected: PASS if Task 2 and Task 3 already wired classes; if it fails due style class placement, adjust `AppShell` class composition to match the test.

- [ ] **Step 3: Replace app CSS variables and app preference classes**

Replace `apps/desktop/src/shared/styles/app.css` with:

```css
@import 'tailwindcss';

:root {
  --app-bg: #ffffff;
  --sidebar-bg: #f7f7f5;
  --workspace-bg: #ffffff;
  --modal-bg: #ffffff;
  --panel-bg: #fafafa;
  --control-bg: #ffffff;
  --control-hover-bg: #ededeb;
  --control-active-bg: #e8e8e5;
  --text-primary: #1f1f1f;
  --text-secondary: #4d4d4d;
  --text-muted: #757575;
  --border-soft: #dededb;

  color: var(--text-primary);
  color-scheme: light;
}

:root[data-theme='dark'] {
  --app-bg: #181818;
  --sidebar-bg: #20201f;
  --workspace-bg: #181818;
  --modal-bg: #20201f;
  --panel-bg: #252523;
  --control-bg: #262625;
  --control-hover-bg: #30302e;
  --control-active-bg: #3a3a37;
  --text-primary: #f4f4f0;
  --text-secondary: #c9c9c3;
  --text-muted: #8f8f89;
  --border-soft: #343431;

  color: var(--text-primary);
  color-scheme: dark;
}

html,
body {
  min-height: 100%;
  margin: 0;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'SF Pro Display',
    'PingFang SC',
    sans-serif;
  color: var(--text-primary);
  background: var(--app-bg);
}

body {
  min-width: 360px;
}

#root {
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--text-primary) 45%, transparent);
  outline-offset: 2px;
}

.app-density-compact {
  --shell-control-height: 32px;
}

.app-density-comfortable {
  --shell-control-height: 36px;
}

.app-font-small {
  font-size: 14px;
}

.app-font-large {
  font-size: 16px;
}

.app-reduce-motion *,
.app-reduce-motion *::before,
.app-reduce-motion *::after {
  scroll-behavior: auto !important;
  transition-duration: 0.01ms !important;
}

.app-drag-region {
  -webkit-app-region: drag;
}

.app-no-drag {
  -webkit-app-region: no-drag;
}
```

- [ ] **Step 4: Run app tests and typecheck for CSS-driven class changes**

Run:

```bash
pnpm --filter @gaoge/app-desktop test -- src/App.test.tsx
pnpm --filter @gaoge/app-desktop typecheck
```

Expected: both PASS.

- [ ] **Step 5: Commit Task 5**

Run:

```bash
git add apps/desktop/src/App.test.tsx apps/desktop/src/shared/styles/app.css
git commit -m "style: apply codex desktop visuals"
```

## Task 6: Update Desktop Smoke Test and Run Final Verification

**Files:**

- Modify: `apps/desktop/e2e/app.spec.ts`

- [ ] **Step 1: Update Electron smoke test text**

Replace `apps/desktop/e2e/app.spec.ts` with:

```ts
import { _electron as electron, expect, test } from '@playwright/test'

test('desktop shell boots and shows the Codex workspace', async () => {
  const app = await electron.launch({
    args: ['dist/main/index.js'],
  })

  const page = await app.firstWindow()

  await expect(page.getByRole('button', { name: 'Chats' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Workspace placeholder' })).toBeVisible()

  await app.close()
})
```

- [ ] **Step 2: Run unit tests**

Run:

```bash
pnpm --filter @gaoge/app-desktop test
```

Expected: PASS.

- [ ] **Step 3: Run desktop typecheck**

Run:

```bash
pnpm --filter @gaoge/app-desktop typecheck
```

Expected: PASS.

- [ ] **Step 4: Run full repository lint**

Run:

```bash
pnpm lint
```

Expected: PASS. If unrelated pre-existing lint failures appear outside `apps/desktop`, record the exact failing files and continue with desktop-specific evidence.

- [ ] **Step 5: Build desktop app**

Run:

```bash
pnpm --filter @gaoge/app-desktop build
```

Expected: PASS and `apps/desktop/dist` is produced.

- [ ] **Step 6: Run Electron smoke test**

Run:

```bash
pnpm --filter @gaoge/app-desktop test:e2e
```

Expected: PASS. If local Electron launch is blocked by the environment, record the exact error and keep unit/typecheck/build evidence.

- [ ] **Step 7: Commit Task 6**

Run:

```bash
git add apps/desktop/e2e/app.spec.ts
git commit -m "test: update desktop codex smoke test"
```

## Final Review Checklist

- [ ] `apps/desktop` opens to a Codex-style left sidebar and blank right workspace.
- [ ] The sidebar contains `Chats`, `Tasks`, `Code Review`, `Environments`, and bottom `Settings`.
- [ ] The right workspace changes empty-state copy when a top menu is clicked.
- [ ] Settings opens as a modal.
- [ ] Settings sections are clickable: `General`, `Appearance`, `Account`, `Model`, `Integrations`, `Advanced`.
- [ ] `General` persists language, startup view, notifications, auto update checks, and confirm actions.
- [ ] `Appearance` persists theme, density, sidebar labels, font size, and reduce motion.
- [ ] Account/model/integration/advanced controls provide visible fake-data feedback without calling real services.
- [ ] Old high-song business desktop content is gone from the renderer UI.
- [ ] `pnpm --filter @gaoge/app-desktop test` passes.
- [ ] `pnpm --filter @gaoge/app-desktop typecheck` passes.
- [ ] `pnpm --filter @gaoge/app-desktop build` passes.
- [ ] `pnpm lint` passes, or unrelated failures are documented.
