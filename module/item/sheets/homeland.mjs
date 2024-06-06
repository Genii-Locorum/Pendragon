import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'
import { PENUtilities } from "../../apps/utilities.mjs"

export class PendragonHomelandSheet extends ItemSheet {
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
      width: 520,
      height: 570,
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
    const passions = []
    for (let pItm of this.item.system.passions){
      let valid = true
      if ((await game.system.api.pid.fromPIDBest({pid:pItm.pid})).length <1) {valid = false}
      passions.push({name: pItm.name, uuid: pItm.uuid, pid: pItm.pid, valid: valid})      
    }
    passions.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });    

    sheetData.passions = passions
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
    html.find('.item-delete').click(event => this._onItemDelete(event))
    const dragDrop = new DragDrop({
      dropSelector: '.droppable',
      callbacks: { drop: this._onDrop.bind(this) }
    })
    dragDrop.bind(html[0])
  }
  
  /* -------------------------------------------- */
  
  //Allow for an item being dragged and dropped on to the sheet
  async _onDrop (event, type = 'passion', collectionName = 'passions') {
    event.preventDefault()
    event.stopPropagation()
    const dataList = await PENUtilities.getDataFromDropEvent(event, 'Item')
    const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []
 
    for (const item of dataList) {
      if (!item || !item.system) continue
      if (![type].includes(item.type)) {continue}
      //Dropping in Passion list
      if (collection.find(el => el.pid === item.flags.Pendragon.pidFlag.id)) {
        ui.notifications.warn(item.name + " : " +   game.i18n.localize('PEN.dupItem'));
        continue
      }
      collection.push({name: item.name, oppName: item.system.oppName, uuid: item.uuid, pid:item.flags.Pendragon.pidFlag.id})
    }
    await this.item.update({ [`system.${collectionName}`]: collection })
  }

  //Delete's a skill in the main skill list      
  async _onItemDelete (event, collectionName = 'passions') {
    const target = $(event.currentTarget).closest('.item')
    const itemId = target.data('item-id')
    const itemIndex = this.item.system[collectionName].findIndex(itm => (itemId && itm.uuid === itemId))
    if (itemIndex > -1) {
      const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []
      collection.splice(itemIndex, 1)
      await this.item.update({ [`system.${collectionName}`]: collection })
    }
  }

}