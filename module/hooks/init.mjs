import { registerSheets } from '../setup/register-sheets.mjs'
import { PID } from '../pid/pid.mjs'


export function listen () {
    Hooks.once('init', async () => {
      PID.init()
      registerSheets()
    })
  }