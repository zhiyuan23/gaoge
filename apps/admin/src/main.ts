import { createApiClient } from '@gaoge/sdk-api-client'
import { appName } from '@gaoge/shared-constants'
import { lightTokens } from '@gaoge/ui-tokens'

export const adminShell = {
  app: `${appName} Admin`,
  api: createApiClient('/admin-api'),
  theme: lightTokens,
}

console.log('apps/admin scaffold ready', adminShell)
