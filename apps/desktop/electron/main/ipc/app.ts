import { app, ipcMain } from '../electron-runtime'

export function registerAppIpc() {
  ipcMain.handle('app:get-version', () => app.getVersion())
}
