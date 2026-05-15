declare global {
  interface Window {
    gaoge: {
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
  }
}

export {}
