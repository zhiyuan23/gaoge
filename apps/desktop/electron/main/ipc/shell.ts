import { ipcMain, shell } from '../electron-runtime'

export function registerShellIpc() {
  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    await shell.openExternal(url)
    return true
  })
}
