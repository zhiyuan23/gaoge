export interface GaogeBridge {
  app: {
    getVersion(): Promise<string>
  }
  db: {
    getSetting(key: string): Promise<string | null>
    setSetting(key: string, value: string): Promise<boolean>
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
  db: {
    async getSetting() {
      return null
    },
    async setSetting() {
      return false
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
    db: {
      getSetting: gaoge?.db?.getSetting ?? fallbackBridge.db.getSetting,
      setSetting: gaoge?.db?.setSetting ?? fallbackBridge.db.setSetting,
    },
    shell: {
      openExternal: gaoge?.shell?.openExternal ?? fallbackBridge.shell.openExternal,
    },
  }
}

export const electronBridge = createElectronBridge(globalThis as BridgeSource)
