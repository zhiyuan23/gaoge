export interface NetworkState {
  online: boolean
}

const networkState: NetworkState = {
  online: true,
}

export function getNetworkState() {
  return networkState
}

export function setNetworkState(nextState: Partial<NetworkState>) {
  Object.assign(networkState, nextState)
}
