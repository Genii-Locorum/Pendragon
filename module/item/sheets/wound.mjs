export class PendragonWoundSheet extends ItemSheet {
    constructor (...args) {
      super(...args)
      this._sheetTab = 'items'
    }
  
    static get defaultOptions () {
      return mergeObject(super.defaultOptions, {
        classes: ['Pendragon', 'sheet', 'item'],
        width: 210,
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
      html.find('.dam-value').change(this.onDescription.bind(this));
    }
   

    async onDescription (event) {
      let actor = game.actors.get(this.item.parent._id)
      //If the wound has already been created then take no further action.  Otherwise work out the severity of the wound and update it and created flag.
      //This means the description is set at the point the wound is created, not based on its current damage
      if(this.item.system.created) {return}
      await this._onSubmit(event)
      this.close()
      let status = game.i18n.localize('PEN.minor') 
      let unconscious = false;
      console.log(this.item.system.value, actor.system.hp.max, actor.system.hp.majorWnd)

      if (this.item.system.value >= actor.system.hp.max){
        status = game.i18n.localize('PEN.mortal')
        unconscious = true;
      } else if (this.item.system.value >= actor.system.hp.majorWnd){
        status = game.i18n.localize('PEN.major')
        unconscious = true;
      }

      //Check to see if damage >= current HP
      if (actor.system.hp.value < actor.system.hp.unconscious) {
        unconscious = true;
      }

      let checkProp = {'system.created': true,
                        'system.description': status}

      await this.item.update(checkProp)



      if (unconscious){
        checkProp = {'system.status.unconscious': true,
                     'system.status.debilitated': true}
        await actor.update(checkProp)
      }

      return;
    }

}