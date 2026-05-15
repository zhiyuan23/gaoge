# Electron App Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前 `pnpm monorepo` 中新增 `apps/desktop`，落地一套可运行、可构建、可测试的 `Electron + React + Tailwind + SQLite` 桌面应用底座。

**Architecture:** `apps/desktop` 作为独立真实应用接入，`main` 持有窗口、IPC 和 SQLite 能力，`preload` 只暴露白名单桥接，`renderer` 使用 `React + TanStack Query + Zustand` 承载页面与状态。首阶段只实现桌面壳、设置持久化和基础页面，不提前引入复杂业务模块或离线同步引擎。

**Tech Stack:** Electron, electron-vite, React, TypeScript, react-router-dom, Tailwind CSS, shadcn/ui style primitives, TanStack Query, Zustand, Zod, better-sqlite3, electron-builder, Vitest, Testing Library, Playwright

---

### Task 1: 接入 workspace、根脚本和构建配置

**Files:**

- Create: `apps/desktop/package.json`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/tsconfig.node.json`
- Create: `apps/desktop/tsconfig.web.json`
- Create: `apps/desktop/electron.vite.config.ts`
- Create: `apps/desktop/builder.config.ts`
- Create: `apps/desktop/index.html`
- Modify: `scripts/dev-with-api.test.mjs`
- Modify: `scripts/dev-with-api.mjs`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Write the failing test**

```js
test('isSupportedTarget returns true for electron', () => {
  assert.equal(isSupportedTarget('electron'), true)
})

test('buildTurboArgs includes electron filter when api is already running', () => {
  assert.deepEqual(buildTurboArgs('electron', true), [
    'turbo',
    'run',
    'dev',
    '--filter=@gaoge/app-desktop',
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
Expected: FAIL because `electron` is not in `TARGET_FILTERS`.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/dev-with-api.mjs
const TARGET_FILTERS = {
  admin: '@gaoge/app-admin',
  electron: '@gaoge/app-desktop',
  miniapp: '@gaoge/app-miniapp',
  web: '@gaoge/app-web',
}
```

```json
// package.json
{
  "scripts": {
    "dev:desktop": "node scripts/dev-with-api.mjs electron",
    "dev:desktop-api": "turbo run dev --parallel --filter=@gaoge/app-desktop --filter=@gaoge/app-api",
    "build:desktop": "turbo run build --filter=@gaoge/app-desktop"
  }
}
```

```json
// tsconfig.json
{
  "references": [
    {
      "path": "./apps/desktop"
    }
  ]
}
```

```json
// apps/desktop/package.json
{
  "name": "@gaoge/app-desktop",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "build:dir": "pnpm build && electron-builder --dir --config builder.config.ts",
    "dist": "pnpm build && electron-builder --config builder.config.ts",
    "test": "vitest run",
    "test:e2e": "pnpm build && playwright test",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "clean": "rm -rf dist .turbo"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.76.1",
    "better-sqlite3": "^12.1.1",
    "clsx": "^2.1.1",
    "electron-log": "^5.4.1",
    "electron-updater": "^6.6.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.0",
    "tailwind-merge": "^3.3.0",
    "zod": "^3.24.4",
    "zustand": "^5.0.4"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@tailwindcss/vite": "^4.1.7",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/better-sqlite3": "^7.6.13",
    "@types/node": "^22.15.29",
    "@types/react": "^19.1.6",
    "@types/react-dom": "^19.1.5",
    "@vitejs/plugin-react": "^4.4.1",
    "electron": "^36.3.1",
    "electron-builder": "^26.0.12",
    "electron-vite": "^3.1.0",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.1.7",
    "typescript": "^5.9.3",
    "vite": "^6.3.5",
    "vitest": "^3.1.4"
  }
}
```

```json
// apps/desktop/tsconfig.json
{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.node.json"
    },
    {
      "path": "./tsconfig.web.json"
    }
  ]
}
```

```json
// apps/desktop/tsconfig.node.json
{
  "extends": "../../packages/configs/typescript-config/base.json",
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "types": ["node", "electron"]
  },
  "include": ["electron/**/*.ts", "electron.vite.config.ts", "builder.config.ts"]
}
```

```json
// apps/desktop/tsconfig.web.json
{
  "extends": "../../packages/configs/typescript-config/web.json",
  "compilerOptions": {
    "baseUrl": ".",
    "composite": true,
    "jsx": "react-jsx",
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["node", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.d.ts"]
}
```

```ts
// apps/desktop/electron.vite.config.ts
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
    },
  },
  preload: {
    build: {
      outDir: 'dist/preload',
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
    build: {
      outDir: 'dist/renderer',
    },
  },
})
```

```ts
// apps/desktop/builder.config.ts
import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.gaoge.desktop',
  productName: 'Gaoge Desktop',
  directories: {
    output: 'dist/builder',
  },
  files: ['dist/main/**/*', 'dist/preload/**/*', 'dist/renderer/**/*', 'package.json'],
  mac: {
    target: ['dmg'],
  },
  win: {
    target: ['nsis'],
  },
}

export default config
```

```html
<!-- apps/desktop/index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gaoge Desktop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`
Expected: lockfile updated and `@gaoge/app-desktop` becomes a recognized workspace package.

- [ ] **Step 5: Run verification**

Run: `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH node --test scripts/dev-with-api.test.mjs`
Expected: PASS including the new electron target assertions.

Run: `pnpm --filter @gaoge/app-desktop typecheck`
Expected: PASS with no TypeScript errors from the new workspace manifests.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json scripts/dev-with-api.mjs scripts/dev-with-api.test.mjs apps/desktop/package.json apps/desktop/tsconfig.json apps/desktop/tsconfig.node.json apps/desktop/tsconfig.web.json apps/desktop/electron.vite.config.ts apps/desktop/builder.config.ts apps/desktop/index.html pnpm-lock.yaml
git commit -m "feat: scaffold electron workspace"
```

### Task 2: 搭好 Electron main、preload 和 bridge 契约

**Files:**

- Create: `apps/desktop/electron/main/index.ts`
- Create: `apps/desktop/electron/main/window.ts`
- Create: `apps/desktop/electron/main/ipc/index.ts`
- Create: `apps/desktop/electron/main/ipc/app.ts`
- Create: `apps/desktop/electron/main/ipc/shell.ts`
- Create: `apps/desktop/electron/preload/index.ts`
- Create: `apps/desktop/electron/preload/types.d.ts`
- Create: `apps/desktop/src/bridges/electron.ts`
- Create: `apps/desktop/src/bridges/electron.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest'

import { createElectronBridge } from './electron'

describe('createElectronBridge', () => {
  it('returns safe fallbacks when preload bridge is missing', async () => {
    const bridge = createElectronBridge({})

    await expect(bridge.app.getVersion()).resolves.toBe('0.0.0-dev')
    await expect(bridge.shell.openExternal('https://gaoge.app')).resolves.toBe(false)
  })

  it('delegates to window.gaoge when preload bridge is present', async () => {
    const gaoge = {
      app: {
        getVersion: vi.fn().mockResolvedValue('1.2.3'),
      },
      shell: {
        openExternal: vi.fn().mockResolvedValue(true),
      },
    }

    const bridge = createElectronBridge({ gaoge })

    await expect(bridge.app.getVersion()).resolves.toBe('1.2.3')
    await expect(bridge.shell.openExternal('https://gaoge.app')).resolves.toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gaoge/app-desktop test -- src/bridges/electron.test.ts`
Expected: FAIL because `src/bridges/electron.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/desktop/src/bridges/electron.ts
export interface GaogeBridge {
  app: {
    getVersion(): Promise<string>
  }
  shell: {
    openExternal(url: string): Promise<boolean>
  }
}

type BridgeSource = {
  gaoge?: Partial<GaogeBridge>
}

const fallbackBridge: GaogeBridge = {
  app: {
    async getVersion() {
      return '0.0.0-dev'
    },
  },
  shell: {
    async openExternal() {
      return false
    },
  },
}

export function createElectronBridge(source: BridgeSource): GaogeBridge {
  const gaoge = source.gaoge

  return {
    app: {
      getVersion: gaoge?.app?.getVersion ?? fallbackBridge.app.getVersion,
    },
    shell: {
      openExternal: gaoge?.shell?.openExternal ?? fallbackBridge.shell.openExternal,
    },
  }
}

export const electronBridge = createElectronBridge(globalThis as BridgeSource)
```

```ts
// apps/desktop/electron/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

const gaogeBridge = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
}

contextBridge.exposeInMainWorld('gaoge', gaogeBridge)
```

```ts
declare global {
  interface Window {
    gaoge: {
      app: {
        getVersion(): Promise<string>
      }
      shell: {
        openExternal(url: string): Promise<boolean>
      }
    }
  }
}

export {}
```

```ts
// apps/desktop/electron/main/ipc/app.ts
import { app, ipcMain } from 'electron'

export function registerAppIpc() {
  ipcMain.handle('app:get-version', () => app.getVersion())
}
```

```ts
// apps/desktop/electron/main/ipc/shell.ts
import { ipcMain, shell } from 'electron'

export function registerShellIpc() {
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    await shell.openExternal(url)
    return true
  })
}
```

```ts
// apps/desktop/electron/main/ipc/index.ts
import { registerAppIpc } from './app'
import { registerShellIpc } from './shell'

export function registerIpcHandlers() {
  registerAppIpc()
  registerShellIpc()
}
```

```ts
// apps/desktop/electron/main/window.ts
import { BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 720,
    title: 'Gaoge Desktop',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  return window
}
```

```ts
// apps/desktop/electron/main/index.ts
import { app, BrowserWindow } from 'electron'

import { registerIpcHandlers } from './ipc'
import { createMainWindow } from './window'

async function openMainWindow() {
  const mainWindow = createMainWindow()

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    await mainWindow.loadFile('dist/renderer/index.html')
  }
}

async function bootstrap() {
  await app.whenReady()

  registerIpcHandlers()

  await openMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void openMainWindow()
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

bootstrap()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @gaoge/app-desktop test -- src/bridges/electron.test.ts`
Expected: PASS for both fallback and delegate cases.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/electron/main/index.ts apps/desktop/electron/main/window.ts apps/desktop/electron/main/ipc/index.ts apps/desktop/electron/main/ipc/app.ts apps/desktop/electron/main/ipc/shell.ts apps/desktop/electron/preload/index.ts apps/desktop/electron/preload/types.d.ts apps/desktop/src/bridges/electron.ts apps/desktop/src/bridges/electron.test.ts
git commit -m "feat: add electron shell bridge"
```

### Task 3: 接入 React renderer、路由、Provider 和基础样式

**Files:**

- Create: `apps/desktop/src/main.tsx`
- Create: `apps/desktop/src/App.tsx`
- Create: `apps/desktop/src/app/router/index.tsx`
- Create: `apps/desktop/src/app/providers/app-providers.tsx`
- Create: `apps/desktop/src/pages/home/page.tsx`
- Create: `apps/desktop/src/pages/settings/page.tsx`
- Create: `apps/desktop/src/state/ui-store.ts`
- Create: `apps/desktop/src/shared/styles/app.css`
- Create: `apps/desktop/src/test/setup.ts`
- Create: `apps/desktop/src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'

import App from './App'

test('renders the desktop home shell', async () => {
  render(<App />)

  expect(await screen.findByText('Gaoge Desktop')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gaoge/app-desktop test -- src/App.test.tsx`
Expected: FAIL because `App.tsx` and the router tree do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/desktop/src/state/ui-store.ts
import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  toggleSidebar(): void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
```

```tsx
// apps/desktop/src/pages/home/page.tsx
import { electronBridge } from '@/bridges/electron'

export function HomePage() {
  void electronBridge.app.getVersion()

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-8 py-12">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Desktop Shell</p>
        <h1 className="text-5xl font-semibold">Gaoge Desktop</h1>
        <p className="max-w-2xl text-base text-zinc-300">
          Electron renderer, routing, query providers and local bridge are wired.
        </p>
      </div>
    </main>
  )
}
```

```tsx
// apps/desktop/src/pages/settings/page.tsx
export function SettingsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-8 py-12 text-zinc-50">
      <h1 className="text-3xl font-semibold">Settings</h1>
    </main>
  )
}
```

```tsx
// apps/desktop/src/app/router/index.tsx
import { createHashRouter } from 'react-router-dom'

import { HomePage } from '@/pages/home/page'
import { SettingsPage } from '@/pages/settings/page'

export const appRouter = createHashRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
])
```

```tsx
// apps/desktop/src/app/providers/app-providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

const queryClient = new QueryClient()

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

```tsx
// apps/desktop/src/App.tsx
import { RouterProvider } from 'react-router-dom'

import { AppProviders } from '@/app/providers/app-providers'
import { appRouter } from '@/app/router'

export default function App() {
  return (
    <AppProviders>
      <nav className="fixed right-6 top-6 z-10">
        <a
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
          href="#/settings"
        >
          Settings
        </a>
      </nav>
      <RouterProvider router={appRouter} />
    </AppProviders>
  )
}
```

```tsx
// apps/desktop/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './shared/styles/app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

```css
/* apps/desktop/src/shared/styles/app.css */
@import 'tailwindcss';

:root {
  color: #ffffff;
  background:
    radial-gradient(circle at top, rgb(16 185 129 / 0.3), transparent 35%),
    linear-gradient(180deg, #09090b 0%, #111827 100%);
}

body {
  margin: 0;
  font-family: 'SF Pro Display', 'PingFang SC', sans-serif;
}

a {
  text-decoration: none;
}
```

```ts
// apps/desktop/src/test/setup.ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @gaoge/app-desktop test -- src/App.test.tsx`
Expected: PASS and the rendered shell shows `Gaoge Desktop` plus the `Settings` link.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/main.tsx apps/desktop/src/App.tsx apps/desktop/src/app/router/index.tsx apps/desktop/src/app/providers/app-providers.tsx apps/desktop/src/pages/home/page.tsx apps/desktop/src/pages/settings/page.tsx apps/desktop/src/state/ui-store.ts apps/desktop/src/shared/styles/app.css apps/desktop/src/test/setup.ts apps/desktop/src/App.test.tsx
git commit -m "feat: add electron renderer shell"
```

### Task 4: 接入 SQLite 设置持久化与 db IPC

**Files:**

- Create: `apps/desktop/database/migrations/001_init.sql`
- Create: `apps/desktop/electron/main/db/settings-repository.ts`
- Create: `apps/desktop/electron/main/db/settings-repository.test.ts`
- Create: `apps/desktop/electron/main/ipc/db.ts`
- Modify: `apps/desktop/electron/main/ipc/index.ts`
- Modify: `apps/desktop/electron/preload/index.ts`
- Modify: `apps/desktop/electron/preload/types.d.ts`
- Modify: `apps/desktop/src/bridges/electron.ts`
- Modify: `apps/desktop/src/pages/settings/page.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, expect, test } from 'vitest'

import { createSettingsRepository } from './settings-repository'

const tempRoots: string[] = []

afterEach(() => {
  for (const tempRoot of tempRoots) {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('createSettingsRepository persists and reads values', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gaoge-electron-'))
  tempRoots.push(tempRoot)

  const repository = createSettingsRepository(path.join(tempRoot, 'settings.db'))

  repository.set('theme', 'emerald')

  expect(repository.get('theme')).toBe('emerald')
  expect(repository.get('missing')).toBeNull()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gaoge/app-desktop test -- electron/main/db/settings-repository.test.ts`
Expected: FAIL because the repository does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```sql
-- apps/desktop/database/migrations/001_init.sql
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at text not null default current_timestamp
);
```

```ts
// apps/desktop/electron/main/db/settings-repository.ts
import fs from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'

export function createSettingsRepository(databasePath: string) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })

  const database = new Database(databasePath)
  const initSql = fs.readFileSync(
    path.resolve(process.cwd(), 'database/migrations/001_init.sql'),
    'utf8',
  )
  database.exec(initSql)

  const getStatement = database.prepare<[string], { value: string }>(
    'select value from app_settings where key = ?',
  )
  const setStatement = database.prepare<[string, string]>(
    `
      insert into app_settings (key, value, updated_at)
      values (?, ?, current_timestamp)
      on conflict(key) do update set value = excluded.value, updated_at = current_timestamp
    `,
  )

  return {
    get(key: string) {
      return getStatement.get(key)?.value ?? null
    },
    set(key: string, value: string) {
      setStatement.run(key, value)
    },
  }
}
```

```ts
// apps/desktop/electron/main/ipc/db.ts
import { app, ipcMain } from 'electron'
import path from 'node:path'

import { createSettingsRepository } from '../db/settings-repository'

export function registerDbIpc() {
  const repository = createSettingsRepository(path.join(app.getPath('userData'), 'settings.db'))

  ipcMain.handle('db:get-setting', (_event, key: string) => repository.get(key))
  ipcMain.handle('db:set-setting', (_event, key: string, value: string) => {
    repository.set(key, value)
    return true
  })
}
```

```ts
// apps/desktop/electron/main/ipc/index.ts
import { registerDbIpc } from './db'

export function registerIpcHandlers() {
  registerAppIpc()
  registerShellIpc()
  registerDbIpc()
}
```

```ts
// apps/desktop/electron/preload/index.ts
const gaogeBridge = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
  db: {
    getSetting: (key: string) => ipcRenderer.invoke('db:get-setting', key),
    setSetting: (key: string, value: string) => ipcRenderer.invoke('db:set-setting', key, value),
  },
}
```

```ts
// apps/desktop/electron/preload/types.d.ts
declare global {
  interface Window {
    gaoge: {
      app: {
        getVersion(): Promise<string>
      }
      shell: {
        openExternal(url: string): Promise<boolean>
      }
      db: {
        getSetting(key: string): Promise<string | null>
        setSetting(key: string, value: string): Promise<boolean>
      }
    }
  }
}

export {}
```

```ts
// apps/desktop/src/bridges/electron.ts
export interface GaogeBridge {
  app: {
    getVersion(): Promise<string>
  }
  shell: {
    openExternal(url: string): Promise<boolean>
  }
  db: {
    getSetting(key: string): Promise<string | null>
    setSetting(key: string, value: string): Promise<boolean>
  }
}
```

```tsx
// apps/desktop/src/pages/settings/page.tsx
import { useEffect, useState } from 'react'

import { electronBridge } from '@/bridges/electron'

export function SettingsPage() {
  const [theme, setTheme] = useState('emerald')

  useEffect(() => {
    electronBridge.db.getSetting('theme').then((value) => {
      if (value) {
        setTheme(value)
      }
    })
  }, [])

  async function handlePersistTheme() {
    await electronBridge.db.setSetting('theme', theme)
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-8 py-12 text-zinc-50">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="mt-8 flex max-w-md flex-col gap-4">
        <label className="text-sm text-zinc-300" htmlFor="theme-input">
          Accent Theme
        </label>
        <input
          id="theme-input"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
        />
        <button
          className="rounded-xl bg-emerald-400 px-4 py-3 font-medium text-zinc-950"
          onClick={handlePersistTheme}
          type="button"
        >
          Save
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @gaoge/app-desktop test -- electron/main/db/settings-repository.test.ts`
Expected: PASS and the repository returns the persisted `theme` value.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/database/migrations/001_init.sql apps/desktop/electron/main/db/settings-repository.ts apps/desktop/electron/main/db/settings-repository.test.ts apps/desktop/electron/main/ipc/db.ts apps/desktop/electron/main/ipc/index.ts apps/desktop/electron/preload/index.ts apps/desktop/electron/preload/types.d.ts apps/desktop/src/bridges/electron.ts apps/desktop/src/pages/settings/page.tsx
git commit -m "feat: add electron settings persistence"
```

### Task 5: 补齐烟测、文档和仓库规则同步

**Files:**

- Create: `apps/desktop/playwright.config.ts`
- Create: `apps/desktop/e2e/app.spec.ts`
- Modify: `AGENTS.md`

- [ ] **Step 1: Write the failing smoke test**

```ts
import { _electron as electron, expect, test } from '@playwright/test'

test('desktop shell boots and shows the home title', async () => {
  const app = await electron.launch({
    args: ['dist/main/index.js'],
  })

  const page = await app.firstWindow()

  await expect(page.getByText('Gaoge Desktop')).toBeVisible()

  await app.close()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @gaoge/app-desktop test:e2e`
Expected: FAIL because there is no Playwright config yet and no built Electron app for the smoke test.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/desktop/playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    trace: 'retain-on-failure',
  },
})
```

```md
<!-- AGENTS.md -->

- `apps/desktop` 已完成首轮接入，当前为真实 Electron/React 桌面项目

当前应用包括：

- `apps/admin`
- `apps/web`
- `apps/miniapp`
- `apps/api`
- `apps/desktop`

根目录工作流已按应用拆分为独立部署入口，`api`、`web`、`admin`、`miniapp`、`electron` 应分别维护自己的发布流程。

常用命令：

- `pnpm dev:desktop`
- `pnpm dev:desktop-api`
- `pnpm build:desktop`
```

- [ ] **Step 4: Run verification**

Run: `pnpm --filter @gaoge/app-desktop build`
Expected: PASS and produce `dist/main`, `dist/preload` and `dist/renderer`.

Run: `pnpm --filter @gaoge/app-desktop test:e2e`
Expected: PASS and the Electron window shows `Gaoge Desktop`.

Run: `pnpm lint`
Expected: PASS and include the new `apps/desktop` sources plus the updated `AGENTS.md`.

Run: `pnpm typecheck`
Expected: PASS with the new workspace reference included.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md apps/desktop/playwright.config.ts apps/desktop/e2e/app.spec.ts
git commit -m "test: add electron smoke coverage"
```
