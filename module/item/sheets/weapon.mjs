import {PENSelectLists}  from "../../apps/select-lists.mjs";

export class PendragonWeaponSheet extends ItemSheet {
    constructor (...args) {
      super(...args)
      this._sheetTab = 'items'
    }
  
    static get defaultOptions () {
      return mergeObject(super.defaultOptions, {
        classes: ['Pendragon', 'sheet', 'item'],
        width: 520,
        height: 620,
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
      sheetData.skillType = PENSelectLists.getWeaponTypes();
      sheetData.skill = sheetData.skillType[this.item.system.skill]
      sheetData.damageType = PENSelectLists.getWeaponDmg();
      sheetData.damageChar = sheetData.damageType[this.item.system.damageChar]
      sheetData.usageType = PENSelectLists.getWeaponUse();
      sheetData.mounted = sheetData.usageType[this.item.system.mounted]
      sheetData.rangeType = PENSelectLists.getWeaponRange();
      sheetData.range = sheetData.rangeType[this.item.system.range]
     
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
    if (prop === 'melee') {
      checkProp = {'system.melee': !this.item.system.melee}
    }

    await this.item.update(checkProp)
    return;
  
  }
  
 


  }