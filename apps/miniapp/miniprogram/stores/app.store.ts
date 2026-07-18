export interface AppState {
  brandName: string
  launchedAt: number
}

const appState: AppState = {
  brandName: '',
  launchedAt: 0,
}

export function getAppState() {
  return appState
}

export function setAppState(nextState: Partial<AppState>) {
  Object.assign(appState, nextState)
}
