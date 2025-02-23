import {PENSelectLists}  from "../../apps/select-lists.mjs";
import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'

export class PendragonSkillSheet extends ItemSheet {
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
      height: 680,
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
    sheetData.weaponType = await PENSelectLists.getWeaponTypes();
    sheetData.weapon = sheetData.weaponType[this.item.system.weaponType]
    sheetData.statType = await PENSelectLists.getSkillAtt();
    sheetData.stat = sheetData.statType[this.item.system.base.stat]
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
    html.find('.item-toggle').dblclick(this.onItemToggle.bind(this));
  }
  
  /* -------------------------------------------- */
  //Handle toggle states
  async onItemToggle(event){
    event.preventDefault();
    const prop=event.currentTarget.closest('.item-toggle').dataset.property;
    let checkProp={};
    if(['combat','XP','nonknightly'].includes(prop)){
      checkProp = {[`system.${prop}`]: !this.item.system[prop]}
    } else {return}
    await this.item.update(checkProp)

    return;
  
  }
}