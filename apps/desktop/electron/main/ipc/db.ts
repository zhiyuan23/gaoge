import path from 'node:path'

import { createSettingsRepository } from '../db/settings-repository'
import { app, ipcMain } from '../electron-runtime'

export function registerDbIpc() {
  const repository = createSettingsRepository(path.join(app.getPath('userData'), 'settings.db'))

  ipcMain.handle('db:get-setting', (_event, key: string) => repository.get(key))
  ipcMain.handle('db:set-setting', (_event, key: string, value: string) => {
    repository.set(key, value)
    return true
  })
}
