import {PENSelectLists}  from "../../apps/select-lists.mjs";
import { PIDEditor } from "../../pid/pid-editor.mjs";
const { api, sheets } = foundry.applications;

// I'm copying the boilerplate approach here
// we probably really want a PendragonItemSheet for our common code
export class PendragonArmourSheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2
) {
  constructor (options = {}) {
    super(options)
  }

  static DEFAULT_OPTIONS = {
    classes: ['Pendragon', 'sheet', 'item'],
    position: {
      width: 600,
      height: 520
    },
    // automatically updates the item
    form: {
      submitOnChange: true,
    },
    // alternatively we could override _renderFrame(options)
    window: {
      controls: [{icon: "fa-solid fa-fingerprint", label:"PEN.PIDFlag.id", action: "editPid"}]
    },
    actions: {
      // probably should be implemented on a base class
      onEditImage: this._onEditImage,
      editPid: PendragonArmourSheet.#onEditPid
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
    // if we had a base class, do this then mergeObject
    // let sheetData = await super._prepareContext(options);
    let sheetData = {
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      item: this.item,
      system: this.item.system,
      hasOwner: this.item.isEmbedded === true,
      isGM: game.user.isGM,
      armourType:  await PENSelectLists.getArmourType(),
      fields: this.document.schema.fields,
    }
    let material = this.item.system.material;
    sheetData.armourLabel = sheetData.armourType[material]

    // these two values could be set during _preparePartContext
    sheetData.enrichedDescriptionValue = await TextEditor.enrichHTML(
      this.item.system.description,
      {
        async: true,
        secrets: sheetData.editable
      }
    )
    sheetData.enrichedGMDescriptionValue = await TextEditor.enrichHTML(
      this.item.system.GMdescription,
      {
        async: true,
        secrets: sheetData.editable
      }
    )
    // this could be moved to a helper, review boilerplate code
    sheetData.tabs = {
      attributes: {
        cssClass:  this.tabGroups['primary'] === 'attributes' ? 'active' : '',
        group: 'primary',
        id: 'attributes',
        label: 'PEN.attributes'
      },
      description: {
        cssClass:  this.tabGroups['primary'] === 'description' ? 'active' : '',
        group: 'primary',
        id: 'description',
        label: 'PEN.description'
      },
      gmTab: {
        cssClass:  this.tabGroups['primary'] === 'gmTab' ? 'active' : '',
        group: 'primary',
        id: 'gmTab',
        label: 'PEN.gmTab'
      }
    }
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

  // handle editPid action
  static #onEditPid(event) {
    event.stopPropagation(); // Don't trigger other events
    if ( event.detail > 1 ) return; // Ignore repeated clicks
    new PIDEditor(this.item, {}).render(true, { focus: true })
  }
  /**
   * Handle changing a Document's image.
   *
   * @this PendragonArmourSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }
}