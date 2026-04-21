import { createApiClient } from '@gaoge/sdk-api-client'
import { appName } from '@gaoge/shared-constants'
import { lightTokens } from '@gaoge/ui-tokens'

export const webShell = {
  app: `${appName} Web`,
  api: createApiClient('/web-api'),
  theme: lightTokens,
}

console.log('apps/web scaffold ready', webShell)
