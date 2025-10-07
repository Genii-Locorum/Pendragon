import { registerSheets } from '../setup/register-sheets.mjs'
import { PID } from '../pid/pid.mjs'
import ChaosiumCanvasInterfaceInit from '../apps/chaosium-canvas-interface-init.mjs'


export function listen() {
  Hooks.once('init', async () => {
    PID.init()
    registerSheets()
    ChaosiumCanvasInterfaceInit.initSelf()
  })
}