import { yearToPeriodName } from "../../apps/chronology.mjs";
import { PIDEditor } from '../../pid/pid-editor.mjs'
const { api, sheets } = foundry.applications;


export class PendragonItemSheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2
) {
  constructor(options = {}) {
    super(options);
  }

  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    //define button
    const sheetPID = this.item.flags?.Pendragon?.pidFlag;
    const noId = (typeof sheetPID === 'undefined' || typeof sheetPID.id === 'undefined' || sheetPID.id === '');
    //add button
    const label = game.i18n.localize("PEN.PIDFlag.id");
    const pidEditor = `<button type="button" class="header-control fa-solid fa-fingerprint ${noId ? 'edit-pid-warning' : 'edit-pid-exisiting'}"
        data-action="editPid" data-tooltip="${label}" aria-label="${label}"></button>`;
    let el = this.window.close;
    while (el.previousElementSibling.localName === 'button') {
      el = el.previousElementSibling;
    }
    el.insertAdjacentHTML("beforebegin", pidEditor);
    return frame;
  }

  async _prepareContext(options) {
    return {
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      item: this.item,
      system: this.item.system,
      hasOwner: this.item.isEmbedded === true,
      isGM: game.user.isGM,
      fields: this.document.schema.fields,
      period: yearToPeriodName(this.item.system.yearAvailable)
    };
  }

  /**
   * Handle changing a Document's image.
   *
   * @this PendragonItemSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 39,
      left: this.position.left + 9,
    });
    return fp.browse();
  }

  // handle editPid action
  static _onEditPid(event) {
    event.stopPropagation(); // Don't trigger other events
    if ( event.detail > 1 ) return; // Ignore repeated clicks
    new PIDEditor(this.item, {}).render(true, { focus: true })
  }
}
