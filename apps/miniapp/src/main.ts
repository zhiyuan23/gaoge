import { createApiClient } from '@gaoge/sdk-api-client';
import { appName } from '@gaoge/shared-constants';
import { lightTokens } from '@gaoge/ui-tokens';

export const miniappShell = {
  app: `${appName} Miniapp`,
  api: createApiClient('/miniapp-api'),
  theme: lightTokens,
};

console.log('apps/miniapp scaffold ready', miniappShell);
