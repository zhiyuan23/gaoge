import { registerAppIpc } from './app'
import { registerDbIpc } from './db'
import { registerShellIpc } from './shell'

export function registerIpcHandlers() {
  registerAppIpc()
  registerDbIpc()
  registerShellIpc()
}
