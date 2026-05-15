import type { Configuration } from 'electron-builder'

import { APP_DISPLAY_NAME } from './electron/main/app-config'

const config: Configuration = {
  appId: 'com.gaoge.desktop',
  productName: APP_DISPLAY_NAME,
  directories: {
    output: 'dist/builder',
  },
  files: ['dist/main/**/*', 'dist/preload/**/*', 'dist/renderer/**/*', 'package.json'],
  mac: {
    target: ['dmg'],
  },
  win: {
    target: ['nsis'],
  },
}

export default config
