import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { APP_DISPLAY_NAME } from './app-config'
import { BrowserWindow } from './electron-runtime'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createMainWindow() {
  const window = new BrowserWindow({
    backgroundColor: '#f7f7f5',
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 720,
    title: APP_DISPLAY_NAME,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  return window
}
