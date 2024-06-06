import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'
import { PENUtilities } from "../../apps/utilities.mjs"
import { PENCharCreate } from '../../apps/charCreate.mjs'

export class PendragonIdealSheet extends ItemSheet {
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
      height: 670,
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
    const traitGroup = []
    const require = []

    for (let pItm of this.item.system.require){
      let valid = true
      if ((await game.system.api.pid.fromPIDBest({pid:pItm.pid})).length <1) {valid = false}
      let label = " [" +  game.i18n.localize("PEN.Entities."+(pItm.pid.split(".")[1]).capitalize())+"]"
      if (pItm.score<0 && pItm.pid.split(".")[1] === 'trait') {
        require.push({name: pItm.oppName + label, uuid: pItm.uuid, pid: pItm.pid, score:-pItm.score, valid: valid});
      } else {
        require.push({name: pItm.name + label, uuid: pItm.uuid, pid: pItm.pid, score:pItm.score, valid: valid});
      }  
    }
    require.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });    

    for (let pItm of this.item.system.traitGroup){
      let valid = true
      if ((await game.system.api.pid.fromPIDBest({pid:pItm.pid})).length <1) {valid = false}
      traitGroup.push({name: pItm.name, uuid: pItm.uuid, pid: pItm.pid, valid: valid})      
    }
    traitGroup.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });    

    sheetData.require = require
    sheetData.traitGroup = traitGroup
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
  async _onDrop (event, type = ['trait'], collectionName = 'traitGroup') {
    event.preventDefault()
    event.stopPropagation()
    collectionName = event.currentTarget.dataset.collection
    if (['require'].includes(collectionName)) {
      type =["trait","passion","skill"]
    } else {
      type = ["trait"]
    }
    
     

    const dataList = await PENUtilities.getDataFromDropEvent(event, 'Item')
    const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []
 
    for (const item of dataList) {
      if (!item || !item.system) continue
      if (!type.includes(item.type)) {continue}
      //Dropping in traitGroup list
      if (collection.find(el => el.pid === item.flags.Pendragon.pidFlag.id)) {
        ui.notifications.warn(item.name + " : " +   game.i18n.localize('PEN.dupItem'));
        continue
      }
      let score = 0
      if (['require'].includes(collectionName)) {
        score = await PENCharCreate.inpValue (game.i18n.localize("PEN.minScore"))
      }
      collection.push({name: item.name, oppName: item.system.oppName, uuid: item.uuid, pid:item.flags.Pendragon.pidFlag.id, score: Number(score)})
    }
    await this.item.update({ [`system.${collectionName}`]: collection })
  }

  //Delete's a skill in the main skill list      
  async _onItemDelete (event, collectionName = 'traitGroup') {    
    collectionName = event.currentTarget.dataset.collection
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