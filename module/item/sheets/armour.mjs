export class PendragonArmourSheet extends ItemSheet {
    constructor (...args) {
      super(...args)
      this._sheetTab = 'items'
    }
  
    static get defaultOptions () {
      return mergeObject(super.defaultOptions, {
        classes: ['Pendragon', 'sheet', 'item'],
        width: 600,
        height: 430,
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
    let checkProp="";
    if (prop === 'equipped') {
      checkProp = {'system.equipped': !this.item.system.equipped}
    } else if (prop ==='armour') {    //If type != true = shield, then change to armour (true)
      if (!this.item.system.type) {
        checkProp = {'system.type': true}
      } else {return}
    } else if (prop ==='shield') {  //If type = true = armour, then change to shield (false)
      if (this.item.system.type) {
        checkProp = {'system.type': false}
      } else {return}
    }  
      await this.item.update(checkProp)
    return ;
  }

}