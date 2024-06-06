/* global RollTableConfig */
import { addPIDSheetHeaderButton } from '../pid/pid-button.mjs'

export class PENJournalSheet extends JournalSheet {

  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addPIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }
}

