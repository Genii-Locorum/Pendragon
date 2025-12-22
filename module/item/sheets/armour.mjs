import {PENSelectLists}  from "../../apps/select-lists.mjs";
import { PendragonItemSheet } from "./item-sheet.mjs";

export class PendragonArmourSheet extends PendragonItemSheet {
  constructor (options = {}) {
    super(options)
  }

  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'item',"theme-light"],
    position: {
      width: 600,
      height: 520
    },
    tag: "form",
    // automatically updates the item
    form: {
      submitOnChange: true,
    },
    window: {
      resizable: true,
    },
    actions: {
      // probably should be implemented on a base class
      onEditImage: this._onEditImage,
      editPid: this._onEditPid
    }

  }

  static PARTS = {
    header: {
      template: "systems/Pendragon/templates/item/header.hbs"
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs',
    },
    // each tab gets its own template
    attributes: {
      template: 'systems/Pendragon/templates/item/armour.attributes.hbs'
    },
    description: {
      template: 'systems/Pendragon/templates/item/armour.description.hbs'
    },
    gmTab: {
      template: 'systems/Pendragon/templates/item/gmtab.hbs'
    }
  }

  async _prepareContext (options) {
    // Default tab for first time it's rendered this session
    if (!this.tabGroups.primary) this.tabGroups.primary = 'attributes';

    let sheetData = {
      ...await super._prepareContext(options),
      armourType:  PENSelectLists.getArmourType(),
    }
    let material = this.item.system.material;
    sheetData.armourLabel = sheetData.armourType[material]

    // these two values could be set during _preparePartContext
    sheetData.enrichedDescriptionValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.item.system.description,
      {
        async: true,
        secrets: sheetData.editable,
        relativeTo: this.item
      }
    )
    sheetData.enrichedGMDescriptionValue = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.item.system.GMdescription,
      {
        async: true,
        secrets: sheetData.editable
      }
    )
    sheetData.tabs = this._initTabs('primary', ['attributes', 'description', 'gmTab']);
    return sheetData
  }

  // this does the minimum currently, just sets the tab
  // could also prepare tab-specific fields
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'attributes':
      case 'description':
      case 'gmTab':
        context.tab = context.tabs[partId];
        break;
      default:
    }
    return context;
  }
  
  /* -------------------------------------------- */
  
  /**
   * Activate event listeners using the prepared sheet HTML
   */
  _onRender (context, _options) {
    // Everything below here is only needed if the sheet is editable
    if (!context.editable) return;

    // pure Javascript, no jQuery
    this.element.querySelectorAll('.item-toggle').forEach(n => n.addEventListener("dblclick", this.#onItemToggle.bind(this)));
  }
  
  /* -------------------------------------------- */
  
  //Handle toggle states
  async #onItemToggle(event){
    event.preventDefault();
    const prop=event.currentTarget.closest('.item-toggle').dataset.property;
    let checkProp="";
    if(['equipped','poor'].includes(prop)){
      checkProp = {[`system.${prop}`]: !this.item.system[prop]}
    } else if (prop ==='armour') {    //If type != true = shield, then change to armour (true)
      if (!this.item.system.type) {
        checkProp = {'system.type': true}
      } else {return}
    } else if (prop ==='shield') {  //If type = true = armour, then change to shield (false)
      if (this.item.system.type) {
        checkProp = {'system.type': false}
      } else {return}
    } else {return} 
      await this.item.update(checkProp)
    return ;
  }
}