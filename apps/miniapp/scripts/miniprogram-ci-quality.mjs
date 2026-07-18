import ci from 'miniprogram-ci'

import { createMiniProgramProject } from './miniprogram-ci-project.mjs'

const project = createMiniProgramProject()

await ci.check({
  project,
})
