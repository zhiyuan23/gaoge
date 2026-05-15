import electron from 'electron'

const { contextBridge, ipcRenderer } = electron

const gaogeBridge = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
  },
  db: {
    getSetting: (key: string) => ipcRenderer.invoke('db:get-setting', key),
    setSetting: (key: string, value: string) => ipcRenderer.invoke('db:set-setting', key, value),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
}

contextBridge.exposeInMainWorld('gaoge', gaogeBridge)
