import { PendragonItemSheet } from "./item-sheet.mjs";

export class PendragonWoundSheet extends PendragonItemSheet {
  constructor (options = {}) {
    super(options)
  }

  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'item'],
    position: {
      width: 310,
      height: 240
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
      //TODO: static header, no image
      template: "systems/Pendragon/templates/item/header.hbs"
    },
    // each tab gets its own template
    attributes: {
      template: 'systems/Pendragon/templates/item/wound.hbs'
    },
  }

  async _prepareContext (options) {

    let sheetData = {
      ...await super._prepareContext(options),
    }
    sheetData.source = game.i18n.localize('PEN.'+this.item.system.source);

    return sheetData;
  }

}