import ci from 'miniprogram-ci'

import { createMiniProgramProject } from './miniprogram-ci-project.mjs'

const project = createMiniProgramProject()

await ci.preview({
  desc: 'Gaoge Skyline miniapp preview',
  project,
  qrcodeFormat: 'terminal',
  setting: {
    es6: true,
    minify: true,
  },
  version: process.env.MINIAPP_VERSION ?? '0.1.0',
})
