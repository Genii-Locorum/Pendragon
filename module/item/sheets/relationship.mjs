import { PendragonItemSheet } from "./item-sheet.mjs";

export class PendragonRelationshipSheet extends PendragonItemSheet {
  constructor (options = {}) {
    super(options)
  }

  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'item',"theme-light"],
    position: {
      width: 595,
      height: 480
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
      template: "systems/Pendragon/templates/item/header.hbs"
    },
    tabs: {
      template: 'templates/generic/tab-navigation.hbs',
    },
    // each tab gets its own template
    attributes: {
      template: 'systems/Pendragon/templates/item/relationship.attributes.hbs'
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

}
