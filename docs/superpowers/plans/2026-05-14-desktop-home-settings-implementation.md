# Desktop 首页与设置页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `apps/desktop` 首页补齐完整可交互占位内容，并为设置页增加浅色 / 深色 / 跟随系统主题与中英文基础切换，使桌面壳、首页、设置页同步响应偏好变化。

**Architecture:** 在 `apps/desktop` 内新增轻量偏好层，统一管理主题模式、解析主题和语言，并通过本地词典对象与 CSS 变量驱动界面。首页和设置页只消费偏好状态，不直接分散读写本地设置。

**Tech Stack:** React 19, React Router, Zustand, Vitest, Testing Library, Tailwind CSS v4, Electron preload bridge

---

### Task 1: 为偏好与壳层行为建立失败测试

**Files:**

- Modify: `apps/desktop/src/App.test.tsx`
- Create: `apps/desktop/src/pages/settings/page.test.tsx`
- Test: `apps/desktop/src/App.test.tsx`
- Test: `apps/desktop/src/pages/settings/page.test.tsx`

- [ ] **Step 1: Write the failing shell/i18n/theme tests**

```tsx
test('renders desktop shell text from saved language and theme preferences', async () => {
  render(<App />)

  expect(await screen.findByRole('link', { name: 'Home Workspace' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Preferences' })).toBeInTheDocument()
  expect(screen.getByPlaceholderText('Search players, fixtures, or commands')).toBeInTheDocument()
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})
```

```tsx
test('switches theme mode and language from settings and persists both values', async () => {
  render(<SettingsPage />)

  fireEvent.click(await screen.findByRole('radio', { name: 'Follow System' }))
  fireEvent.click(screen.getByRole('radio', { name: 'English' }))

  await waitFor(() => {
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith('desktop-theme-mode', 'system')
    expect(bridgeMocks.setSetting).toHaveBeenCalledWith('desktop-language', 'en-US')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @gaoge/app-desktop test -- --run apps/desktop/src/App.test.tsx apps/desktop/src/pages/settings/page.test.tsx`
Expected: FAIL because current shell does not read theme/language preferences and there is no settings page test support for radios or immediate persistence.

- [ ] **Step 3: Implement minimal preference infrastructure for shell and settings**

```ts
export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh-CN' | 'en-US'

export function resolveTheme(mode: ThemeMode, prefersDark: boolean) {
  if (mode === 'system') return prefersDark ? 'dark' : 'light'
  return mode
}
```

```tsx
useEffect(() => {
  void hydratePreferences()
}, [])

useEffect(() => {
  document.documentElement.dataset.theme = resolvedTheme
}, [resolvedTheme])
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @gaoge/app-desktop test -- --run apps/desktop/src/App.test.tsx apps/desktop/src/pages/settings/page.test.tsx`
Expected: PASS

### Task 2: 为首页完整占位交互建立失败测试

**Files:**

- Modify: `apps/desktop/src/pages/home/page.test.tsx`
- Test: `apps/desktop/src/pages/home/page.test.tsx`

- [ ] **Step 1: Expand the home page test with the new interactions**

```tsx
test('renders an interactive command dashboard on the home page', async () => {
  render(<HomePage />)

  expect(await screen.findByText('Today at a Glance')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Refresh Briefing' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Lineup View' })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'Confirm training squad' })).toBeInTheDocument()
})
```

```tsx
fireEvent.click(screen.getByRole('button', { name: 'Refresh Briefing' }))
expect(await screen.findByText('Briefing refreshed just now.')).toBeInTheDocument()

fireEvent.click(screen.getByRole('tab', { name: 'Match Plan' }))
expect(screen.getByText('Switching focus to the next match execution window.')).toBeInTheDocument()

fireEvent.click(screen.getByRole('checkbox', { name: 'Confirm training squad' }))
expect(screen.getByText('1 completed')).toBeInTheDocument()
```

- [ ] **Step 2: Run the home page test to verify it fails**

Run: `pnpm --filter @gaoge/app-desktop test -- --run apps/desktop/src/pages/home/page.test.tsx`
Expected: FAIL because the current home page lacks briefing cards, tabs, and checklist interactions.

- [ ] **Step 3: Implement the minimal interactive dashboard behavior**

```tsx
const [briefingIndex, setBriefingIndex] = useState(0)
const [activeView, setActiveView] = useState<'lineup' | 'match'>('lineup')
const [completedIds, setCompletedIds] = useState<string[]>([])
```

```tsx
function handleRefreshBriefing() {
  setBriefingIndex((current) => (current + 1) % dashboardBriefings.length)
  setStatusMessage(t('home.status.briefingRefreshed'))
}
```

- [ ] **Step 4: Run the home page test to verify it passes**

Run: `pnpm --filter @gaoge/app-desktop test -- --run apps/desktop/src/pages/home/page.test.tsx`
Expected: PASS

### Task 3: 实现偏好 store、词典和双主题样式

**Files:**

- Create: `apps/desktop/src/shared/config/preferences.ts`
- Create: `apps/desktop/src/shared/i18n/messages.ts`
- Create: `apps/desktop/src/shared/i18n/use-translation.ts`
- Create: `apps/desktop/src/state/preferences-store.ts`
- Modify: `apps/desktop/src/app/providers/app-providers.tsx`
- Modify: `apps/desktop/src/shared/styles/app.css`
- Test: `apps/desktop/src/App.test.tsx`
- Test: `apps/desktop/src/pages/settings/page.test.tsx`

- [ ] **Step 1: Write/adjust tests for hydration defaults and language rendering**

```tsx
expect(await screen.findByText('Desktop Workspace')).toBeInTheDocument()
expect(document.documentElement).toHaveAttribute('data-theme', 'light')
```

- [ ] **Step 2: Run the targeted tests to verify any new assertions fail**

Run: `pnpm --filter @gaoge/app-desktop test -- --run apps/desktop/src/App.test.tsx apps/desktop/src/pages/settings/page.test.tsx`
Expected: FAIL until the preference store, messages, and root theme syncing exist.

- [ ] **Step 3: Add the preference config, messages, translation helper, and root syncing**

```ts
export const desktopPreferenceKeys = {
  language: 'desktop-language',
  themeMode: 'desktop-theme-mode',
} as const
```

```ts
export const messages = {
  'zh-CN': {
    shell: { navigation: { home: '工作台' } },
  },
  'en-US': {
    shell: { navigation: { home: 'Home Workspace' } },
  },
} as const
```

```css
:root {
  --app-bg: linear-gradient(180deg, #f4f7fb 0%, #dbe7f3 100%);
  --panel-bg: rgba(255, 255, 255, 0.82);
  --text-primary: #0f172a;
}

:root[data-theme='dark'] {
  --app-bg: linear-gradient(180deg, #020617 0%, #08111b 40%, #0f172a 100%);
  --panel-bg: rgba(15, 23, 42, 0.68);
  --text-primary: #f8fafc;
}
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `pnpm --filter @gaoge/app-desktop test -- --run apps/desktop/src/App.test.tsx apps/desktop/src/pages/settings/page.test.tsx`
Expected: PASS

### Task 4: 重构首页与设置页并完成全量验证

**Files:**

- Modify: `apps/desktop/src/app/layout/app-shell.tsx`
- Modify: `apps/desktop/src/pages/home/page.tsx`
- Modify: `apps/desktop/src/pages/settings/page.tsx`
- Modify: `apps/desktop/src/pages/home/page.test.tsx`
- Modify: `apps/desktop/src/App.test.tsx`
- Create: `apps/desktop/src/pages/settings/page.test.tsx`
- Test: `apps/desktop/src/App.test.tsx`
- Test: `apps/desktop/src/pages/home/page.test.tsx`
- Test: `apps/desktop/src/pages/settings/page.test.tsx`

- [ ] **Step 1: Finish the failing assertions for the full page content**

```tsx
expect(await screen.findByText('今日总览')).toBeInTheDocument()
expect(screen.getByText('当前生效主题')).toBeInTheDocument()
expect(screen.getByRole('radio', { name: '跟随系统' })).toBeInTheDocument()
```

- [ ] **Step 2: Run the full desktop test suite to verify remaining failures**

Run: `pnpm --filter @gaoge/app-desktop test`
Expected: FAIL until the shell, home page, and settings page all consume the new preference layer and final content structure.

- [ ] **Step 3: Complete the shell, home page, and settings page implementation**

```tsx
const navigationItems = [
  {
    label: t('shell.navigation.home.label'),
    description: t('shell.navigation.home.description'),
    to: '/',
  },
  {
    label: t('shell.navigation.settings.label'),
    description: t('shell.navigation.settings.description'),
    to: '/settings',
  },
]
```

```tsx
<input
  aria-label={t('home.workspaceNameLabel')}
  value={workspaceName}
  onChange={(event) => setWorkspaceName(event.target.value)}
/>
```

```tsx
<label>
  <input
    checked={themeMode === 'system'}
    name="theme-mode"
    onChange={() => void setThemeMode('system')}
    type="radio"
  />
  {t('settings.theme.system')}
</label>
```

- [ ] **Step 4: Run the full desktop test suite**

Run: `pnpm --filter @gaoge/app-desktop test`
Expected: PASS

- [ ] **Step 5: Run desktop typecheck**

Run: `pnpm --filter @gaoge/app-desktop typecheck`
Expected: PASS
