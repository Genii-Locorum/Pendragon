import { addPIDSheetHeaderButton } from '../../pid/pid-button.mjs'
import { PENUtilities } from "../../apps/utilities.mjs"
import { PendragonItemSheet } from "./item-sheet.mjs";

export class PendragonClassSheet extends PendragonItemSheet {
  #dragDrop;
  constructor (options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'item'],
    position: {
      width: 520,
      height: 570
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
      deleteItem: PendragonClassSheet.#deleteItem
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
      template: 'systems/Pendragon/templates/item/class.attributes.hbs'
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
    const itemData = sheetData.item;
    const primary = [];
    const secondary = [];
    const tertiary = [];
    const gears = []
    
    for (let gItm of itemData.system.gear){
      let valid = true
      if ((await game.system.api.pid.fromPIDBest({pid:gItm.pid})).length <1) {valid = false}
      gears.push({name: gItm.name, uuid: gItm.uuid, pid: gItm.pid, valid: valid})      
    }
    gears.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
      return 0;
    })
    const passions = itemData.system.passions
    passions.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });    
    for (let pItm of passions){
      let valid = true
      if ((await game.system.api.pid.fromPIDBest({pid:pItm.pid})).length <1) {valid = false}
      if (pItm.subType === 'tertiary') {
        tertiary.push({name: pItm.name, uuid: pItm.uuid, pid: pItm.pid, valid: valid});
      } else if (pItm.subType === 'secondary') {
        secondary.push({name: pItm.name, uuid: pItm.uuid, pid: pItm.pid, valid: valid});
      } else {
        primary.push({name: pItm.name, uuid: pItm.uuid, pid: pItm.pid, valid: valid});
      }
    }
    sheetData.primary = primary
    sheetData.secondary = secondary
    sheetData.tertiary = tertiary
    sheetData.gears = gears
    sheetData.gearsisEmpty = sheetData.gears.length ===0;

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

  /**
  * Activate event listeners using the prepared sheet HTML
  * @param html {HTML}   The prepared HTML object ready to be rendered into the DOM
  */
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

  //Allow for an item being dragged and dropped on to the sheet
  async _onDrop (event) {
    event.preventDefault()
    event.stopPropagation()
    let type = ['passion'];
    const collectionName = event.currentTarget.dataset.collection ?? 'passions';
    let subType = event.currentTarget.dataset.section ?? "primary";
    if(collectionName == 'gear') {
      type=["weapon","armour","horse","gear"]
      subType = 'gear'
    }
    const dataList = await PENUtilities.getDataFromDropEvent(event, 'Item')
    const collection = this.item.system[collectionName] ? foundry.utils.duplicate(this.item.system[collectionName]) : []

    for (const item of dataList) {
      if (!item || !item.system) continue;
      if (!type.includes(item.type)) {continue}

      //If no PID then give warning and move to next item
      if (typeof(item.flags?.Pendragon?.pidFlag?.id)=== "undefined") {
        ui.notifications.warn(game.i18n.format('PEN.PIDFlag.noPID', {type:item.name}));
        continue;
      }

      //If Duplicate item then give warning and move to next item
      if (collectionName != 'gear' && collection.find(el => el.pid === item.flags?.Pendragon?.pidFlag?.id)) {
        ui.notifications.warn(item.name + " : " +   game.i18n.localize('PEN.dupItem'));
        continue;
      }

      //Add item to collection
      collection.push({name: item.name, oppName: item.system.oppName, uuid: item.uuid, pid:item.flags.Pendragon.pidFlag.id, subType: subType})
    }
    await this.item.update({ [`system.${collectionName}`]: collection })
  }

  //Delete an trait from the collection
  static async #deleteItem(event, target) {
    const {itemId} = target.closest("[data-item-id]")?.dataset ?? {};
    const {collection} = target.closest('[data-collection]').dataset ?? {};
    const coll = this.item.system[collection] ?? [];
    await this.item.update({ [`system.${collection}`]: coll.filter(itm => itm.uuid != itemId) });
  }
}