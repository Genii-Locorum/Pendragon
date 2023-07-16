import {PENSelectLists}  from "../../apps/select-lists.mjs";

export class PendragonSkillSheet extends ItemSheet {
    constructor (...args) {
      super(...args)
      this._sheetTab = 'items'
    }
  
    static get defaultOptions () {
      return mergeObject(super.defaultOptions, {
        classes: ['Pendragon', 'sheet', 'item'],
        width: 520,
        height: 370,
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
      sheetData.weaponType = PENSelectLists.getWeaponTypes();
      sheetData.weapon = sheetData.weaponType[this.item.system.weaponType]
      
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
    if (prop === 'combat') {
      checkProp = {'system.combat': !this.item.system.combat}
    } else if (prop === 'XP') {
      checkProp = {'system.XP': !this.item.system.XP}
    }

    await this.item.update(checkProp)
    return;
  
  }
  
 


  }