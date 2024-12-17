import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'

export class PendragonRelationshipSheet extends ItemSheet {
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
      width: 595,
      height: 480,
      scrollY: ['.item-bottom-panel'],
      tabs: [{navSelector: '.sheet-tabs',contentSelector: '.sheet-body',initial: 'attributes'}]
    })
  }
  
  /** @override */
  get template () {
    return `systems/Pendragon/templates/item/${this.item.type}.html`
  }
 
   async getData () {
    const sheetData = super.getData()
    const itemData = sheetData.item
    sheetData.hasOwner = this.item.isEmbedded === true
    sheetData.isGM = game.user.isGM
    sheetData.person1Name=""
    sheetData.person2Name=""
    let actr1 = await fromUuid(this.item.system.sourceUuid)
    let actr2 = await fromUuid(this.item.system.targetUuid)
    if (actr1) {
      sheetData.person1Name = actr1.name  
    }
    if (actr2) {
      sheetData.person2Name = actr2.name  
    }

    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.description,
      {
        async: true,
        secrets: sheetData.editable
      }
    )
    sheetData.enrichedGMDescriptionValue = await TextEditor.enrichHTML(
      sheetData.data.system.GMdescription,
      {
        async: true,
        secrets: sheetData.editable
      }
    )
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
   
  _updateObject (event, formData) {
    const system = foundry.utils.expandObject(formData)?.system
    if(typeof system !='undefined') {
    }
    super._updateObject(event, formData)
  }
  
}