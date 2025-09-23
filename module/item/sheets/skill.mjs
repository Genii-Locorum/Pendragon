import {PENSelectLists}  from "../../apps/select-lists.mjs";

import { PendragonItemSheet } from "./item-sheet.mjs";

export class PendragonSkillSheet extends PendragonItemSheet {
  constructor (options = {}) {
    super(options)
  }

  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'item'],
    position: {
      width: 520,
      height: 680
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
      onEditImage: this._onEditImage,
      editPid: this._onEditPid
    }

  }

  static PARTS = {
    header: {
      template: "systems/Pendragon/templates/item/skill.header.hbs"
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs',
    },
    // each tab gets its own template
    attributes: {
      template: 'systems/Pendragon/templates/item/skill.attributes.hbs'
    },
    description: {
      template: 'systems/Pendragon/templates/item/base.description.hbs'
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
    }

    sheetData.weaponType = await PENSelectLists.getWeaponTypes();
    sheetData.weapon = sheetData.weaponType[this.item.system.weaponType]
    sheetData.statType = await PENSelectLists.getSkillAtt();
    sheetData.stat = sheetData.statType[this.item.system.base.stat]
    sheetData.skillcat = []
    sheetData.combat = false
    //Get list of skill categories and then add them to the sheetData with relevant status from system.categories
    //And set combat to true if combat is in system.categories
    for (let cat of game.Pendragon.skillCategories) {
      let status = false
      let matches = (await sheetData.system.categories.filter(itm=>itm===cat)).length
      if (matches > 0) {status = true} 
      sheetData.skillcat.push({cat: cat, label: game.i18n.localize('PEN.skillcat.'+cat), status: status})
      if (cat==='combat') {
        sheetData.combat = status
      }
    }

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

  _onRender (context, _options) {
    // Everything below here is only needed if the sheet is editable
    if (!context.editable) return;

    // pure Javascript, no jQuery
    this.element.querySelectorAll('.item-toggle').forEach(n => n.addEventListener("dblclick", this.#onItemToggle.bind(this)));
    this.element.querySelectorAll('.skillcat-toggle').forEach(n => n.addEventListener("dblclick", this.#onSkillCatToggle.bind(this)));    
    this.element.querySelectorAll('.changeName').forEach(n => n.addEventListener("change", PendragonItemSheet.skillChangeName(this.item)))
  }
  //Handle toggle states
  async #onItemToggle(event){
    event.preventDefault();
    const prop=event.currentTarget.closest('.item-toggle').dataset.property;
    let checkProp={};
    if(['XP','specialisation','starter'].includes(prop)){
      checkProp = {[`system.${prop}`]: !this.item.system[prop]}
    } else {return}
    await this.item.update(checkProp)
    return;
  }

  //Toggle Skill Categories On/Off
  async #onSkillCatToggle(event) {
    event.preventDefault();
    if (!game.user.isGM) {return}
    const prop=event.currentTarget.closest('.skillcat').dataset.property;
    const collection = this.item.system.categories ? foundry.utils.duplicate(this.item.system.categories) : []

    if (collection.includes(prop)) {
      await this.item.update({ 'system.categories': collection.filter(itm => itm != prop) });
    } else {  
      collection.push(prop)
      await this.item.update({'system.categories': collection })
    }
  }

}