import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ci from 'miniprogram-ci'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectPath = path.resolve(__dirname, '..')

export function createMiniProgramProject() {
  const appid = process.env.MINIAPP_APPID
  const privateKeyPath = process.env.MINIAPP_PRIVATE_KEY_PATH

  if (!appid || !privateKeyPath) {
    throw new Error('MINIAPP_APPID and MINIAPP_PRIVATE_KEY_PATH are required for miniprogram-ci')
  }

  return new ci.Project({
    appid,
    privateKeyPath,
    projectPath,
    type: 'miniProgram',
  })
}
