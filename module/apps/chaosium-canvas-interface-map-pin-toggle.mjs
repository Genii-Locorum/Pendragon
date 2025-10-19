import ChaosiumCanvasInterface from "./chaosium-canvas-interface.mjs";

export default class ChaosiumCanvasInterfaceMapPinToggle extends ChaosiumCanvasInterface {
  static get PERMISSIONS () {
    return {
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT]: 'OWNERSHIP.INHERIT',
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE]: 'OWNERSHIP.NONE',
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED]: 'OWNERSHIP.LIMITED',
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER]: 'OWNERSHIP.OBSERVER',
      [CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER]: 'OWNERSHIP.OWNER'
    }
  }

  static get icon () {
    return 'fa-solid fa-map-pin'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      triggerButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Left,
        label: 'PEN.ChaosiumCanvasInterface.MapPinToggle.Button.Title',
        hint: 'PEN.ChaosiumCanvasInterface.MapPinToggle.Button.Hint'
      }),
      toggle: new fields.BooleanField({
        initial: false,
        label: 'PEN.ChaosiumCanvasInterface.MapPinToggle.Toggle.Title',
        hint: 'PEN.ChaosiumCanvasInterface.MapPinToggle.Toggle.Hint'
      }),
      documentUuids: new fields.SetField(
        new fields.DocumentUUIDField(),
        {
          label: 'PEN.ChaosiumCanvasInterface.MapPinToggle.Document.Title',
          hint: 'PEN.ChaosiumCanvasInterface.MapPinToggle.Document.Hint'
        }
      ),
      noteUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Note'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.MapPinToggle.Note.Title',
          hint: 'PEN.ChaosiumCanvasInterface.MapPinToggle.Note.Hint'
        }
      ),
      permissionShow: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceMapPinToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceMapPinToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        label: 'PEN.ChaosiumCanvasInterface.MapPinToggle.PermissionShow.Title',
        hint: 'PEN.ChaosiumCanvasInterface.MapPinToggle.PermissionShow.Hint',
        required: true
      }),
      permissionHide: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceMapPinToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceMapPinToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
        label: 'PEN.ChaosiumCanvasInterface.MapPinToggle.PermissionHide.Title',
        hint: 'PEN.ChaosiumCanvasInterface.MapPinToggle.PermissionHide.Hint',
        required: true
      })
    }
  }

  async _handleMouseOverEvent () {
    return game.user.isGM
  }

  async #handleClickEvent () {
    game.socket.emit('system.Pendragon', { type: 'toggleMapNotes', toggle: true })
    // TODO Remove with v12 support
    game.settings.set('core', (foundry.canvas.layers?.NotesLayer ?? NotesLayer).TOGGLE_SETTING, true)
    for (const uuid of this.documentUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        const permission = (this.toggle ? this.permissionShow : this.permissionHide)
        await doc.update({ 'ownership.default': permission })
      } else {
        console.error('Document ' + uuid + ' not loaded')
      }
    }
    for (const uuid of this.noteUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        const texture = (this.toggle ? 'systems/Pendragon/assets/map-pin.svg' : 'systems/Pendragon/assets/map-pin-dark.svg')
        await doc.update({ 'texture.src': texture })
      } else {
        console.error('Note ' + uuid + ' not loaded')
      }
    }
  }

  async _handleLeftClickEvent () {
    if (this.triggerButton === ChaosiumCanvasInterface.triggerButton.Left) {
      this.#handleClickEvent()
    }
  }

  async _handleRightClickEvent () {
    if (this.triggerButton === ChaosiumCanvasInterface.triggerButton.Right) {
      this.#handleClickEvent()
    }
  }
}
