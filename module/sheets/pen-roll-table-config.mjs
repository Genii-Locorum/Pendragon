/* global RollTableConfig */
import { addPIDSheetHeaderButton } from '../pid/pid-button.mjs'

export class PENRollTableConfig extends RollTableConfig {
  constructor (data, context) {
    data.img = 'icons/svg/d20.svg'
    super(data, context)
  }


  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addPIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }

  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['Pendragon', "sheet", "roll-table-config"],
    })
  }
}

