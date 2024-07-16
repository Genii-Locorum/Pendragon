/* global game */
import { PIDEditor } from './pid-editor.mjs'

export function addPIDSheetHeaderButton (headerButtons, sheet) {
  //if (game.user.isGM) {
    const sheetPID = sheet.object.flags?.Pendragon?.pidFlag
    const noId = (typeof sheetPID === 'undefined' || typeof sheetPID.id === 'undefined' || sheetPID.id === '')
    const PIDEditorButton = {
      class: (noId ? 'edit-pid-warning' : 'edit-pid-exisiting'),
      label: 'PEN.PIDFlag.id',
      icon: 'fas fa-fingerprint',
      onclick: () => { if(game.user.isGM) {
        new PIDEditor(sheet.object, {}).render(true, { focus: true })
      }
    }}
    const numberOfButtons = headerButtons.length
    //headerButtons.splice(numberOfButtons - 1, 0, PIDEditorButton)
    headerButtons.splice(0, 0, PIDEditorButton)
  //}
}