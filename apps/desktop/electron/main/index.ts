import { APP_DISPLAY_NAME } from './app-config'
import { app, BrowserWindow } from './electron-runtime'
import { registerIpcHandlers } from './ipc'
import { registerApplicationMenu } from './menu'
import { createMainWindow } from './window'

async function openMainWindow() {
  const mainWindow = createMainWindow()
  const devServerUrl = process.env.ELECTRON_RENDERER_URL

  console.log(`[desktop] loading renderer from ${devServerUrl ?? 'dist/renderer/index.html'}`)

  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl)
  } else {
    await mainWindow.loadFile('dist/renderer/index.html')
  }
}

async function bootstrap() {
  app.setName(APP_DISPLAY_NAME)

  await app.whenReady()

  app.setName(APP_DISPLAY_NAME)
  app.setAboutPanelOptions({ applicationName: APP_DISPLAY_NAME })

  registerApplicationMenu()
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
