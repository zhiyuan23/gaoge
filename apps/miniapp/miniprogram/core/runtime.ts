import { BrandConfig } from '../config/brand'
import { setAppState } from '../stores/app.store'
import { hydrateAuthState } from '../stores/auth.store'

import { silentLogin } from './auth'

export function initRuntime() {
  setAppState({
    brandName: BrandConfig.appName,
    launchedAt: Date.now(),
  })
  hydrateAuthState()
  void silentLogin()
}
