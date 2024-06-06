import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'

export class PendragonWoundSheet extends ItemSheet {
    constructor (...args) {
      super(...args)
      this._sheetTab = 'items'
    }

  //Add PID buttons to sheet
  _getHeaderButtons () {
    const headerButtons = super._getHeaderButtons()
    addPIDSheetHeaderButton(headerButtons, this)
    return headerButtons
  }    

  static get defaultOptions () {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['Pendragon', 'sheet', 'item'],
      width: 310,
      height: 240,
      scrollY: ['.item-bottom-panel'],
      tabs: [{navSelector: '.sheet-tabs',contentSelector: '.sheet-body',initial: 'attributes'}]
    })
  }
  
  /** @override */
  get template () {
    return `systems/Pendragon/templates/item/${this.item.type}.html`
  }
  
  getData () {
    const sheetData = super.getData()
    const itemData = sheetData.item
    sheetData.hasOwner = this.item.isEmbedded === true
    sheetData.isGM = game.user.isGM
    sheetData.source = game.i18n.localize('PEN.'+this.item.system.source)
      
   
    return sheetData
  }
  
  /* -------------------------------------------- */
  /**
   * Activate event listeners using the prepared sheet HTML
   * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
   */
  activateListeners (html) {
    super.activateListeners(html)
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return
  }
}