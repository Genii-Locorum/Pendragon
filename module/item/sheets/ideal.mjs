import { PENUtilities } from "../../apps/utilities.mjs"
import { PENCharCreate } from '../../apps/charCreate.mjs'
import { PendragonItemSheet } from "./item-sheet.mjs";

export class PendragonIdealSheet extends PendragonItemSheet {
  #dragDrop;
  constructor (options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'item'],
    position: {
      width: 520,
      height: 670
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
      editPid: this._onEditPid,
      deleteItem: PendragonIdealSheet.#deleteItem
    },
    dragDrop: [{dropSelector: ".droppable"}]

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
      template: 'systems/Pendragon/templates/item/ideal.attributes.hbs'
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
    const traitGroup = [];
    const require = [];

    for (let pItm of this.item.system.require){
      let valid = true;
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

    sheetData.require = require;
    sheetData.traitGroup = traitGroup;

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
    this.#dragDrop.forEach((d) => d.bind(this.element));
  }
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        //dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        //dragstart: this._onDragStart.bind(this),
        //dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  _canDragDrop(selector) {
    return this.isEditable;
  }

  async _onDrop (event) {
    event.preventDefault()
    event.stopPropagation()
    const type = ['trait'];
    const collectionName = event.currentTarget.dataset.collection ?? 'traitGroup';
    if (['require'].includes(collectionName)) {
      type.push('passion', 'skill');
    }
    const dataList = await PENUtilities.getDataFromDropEvent(event, 'Item')
    const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []

    for (const item of dataList) {
      if (!item || !item.system) continue;
      if (!type.includes(item.type)) {continue;}

      //If no PID then give warning and move to next item
      if (typeof(item.flags?.Pendragon?.pidFlag?.id)=== "undefined") {
        ui.notifications.warn(game.i18n.format('PEN.PIDFlag.noPID', {type:item.name}));
        continue;
      }

      //If Duplicate item then give warning and move to next item
      if (collection.find(el => el.pid === item.flags?.Pendragon?.pidFlag?.id)) {
        ui.notifications.warn(item.name + " : " +   game.i18n.localize('PEN.dupItem'));
        continue;
      }

      let score = 0;
      if (['require'].includes(collectionName)) {
        score = await PENCharCreate.inpValue (game.i18n.localize("PEN.minScore"))
      }

      //Add item to collection
      collection.push({name: item.name, oppName: item.system.oppName, uuid: item.uuid, pid:item.flags.Pendragon.pidFlag.id, score: Number(score)})
    }


    await this.item.update({ [`system.${collectionName}`]: collection })
  }

  //Delete an item from the collection
  static async #deleteItem(event, target) {
    const {itemId} = target.closest("[data-item-id]")?.dataset ?? {};
    const {collection} = target.closest('[data-collection]').dataset ?? {};
    const coll = this.item.system[collection] ?? [];
    await this.item.update({ [`system.${collection}`]: coll.filter(itm => itm.uuid != itemId) });
  }
}
