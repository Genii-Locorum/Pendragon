import ChaosiumCanvasInterface from "./chaosium-canvas-interface.mjs";

export default class ChaosiumCanvasInterfaceDrawingToggle extends ChaosiumCanvasInterface {
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
    return 'fa-solid fa-pencil'
  }

  static get triggerButtons () {
    const buttons = super.triggerButtons
    buttons[ChaosiumCanvasInterfaceDrawingToggle.triggerButton.Both] = 'PEN.ChaosiumCanvasInterface.Buttons.Both'
    return buttons
  }

  static get triggerButton () {
    const button = super.triggerButton
    button.Both = 20
    return button
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      triggerButton: new fields.NumberField({
        choices: ChaosiumCanvasInterfaceDrawingToggle.triggerButtons,
        initial: ChaosiumCanvasInterfaceDrawingToggle.triggerButton.Left,
        label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.Button.Title',
        hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.Button.Hint'
      }),
      toggle: new fields.BooleanField({
        initial: false,
        label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.Toggle.Title',
        hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.Toggle.Hint'
      }),
      drawingUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Drawing'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.Drawing.Title',
          hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.Drawing.Hint'
        }
      ),
      journalEntryUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'JournalEntry'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.JournalEntry.Title',
          hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.JournalEntry.Hint'
        }
      ),
      permissionDocument: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceDrawingToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceDrawingToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.PermissionDocument.Title',
        hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.PermissionDocument.Hint',
        required: true
      }),
      permissionDocumentHide: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceDrawingToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceDrawingToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
        label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.PermissionDocumentHide.Title',
        hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.PermissionDocumentHide.Hint',
        required: true
      }),
      journalEntryPageUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'JournalEntryPage'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.JournalEntryPage.Title',
          hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.JournalEntryPage.Hint'
        }
      ),
      permissionPage: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceDrawingToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceDrawingToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.PermissionPage.Title',
        hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.PermissionPage.Hint',
        required: true
      }),
      permissionPageHide: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceDrawingToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceDrawingToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
        label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.PermissionPageHide.Title',
        hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.PermissionPageHide.Hint',
        required: true
      }),
      regionBehaviorUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'RegionBehavior'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.RegionBehavior.Title',
          hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.RegionBehavior.Hint'
        }
      ),
      regionButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Right,
        label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.TriggerButton.Title',
        hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.TriggerButton.Hint'
      }),
      regionUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          type: 'Region'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.TriggerRegionUuids.Title',
          hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.TriggerRegionUuids.Hint'
        }
      ),
      triggerAsButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Left,
        label: 'PEN.ChaosiumCanvasInterface.DrawingToggle.TriggerAsButton.Title',
        hint: 'PEN.ChaosiumCanvasInterface.DrawingToggle.TriggerAsButton.Hint'
      }),
    }
  }

  static migrateData (source) {
    if (typeof source.triggerButton === 'undefined' && source.regionUuids?.length) {
      source.triggerButton = ChaosiumCanvasInterfaceDrawingToggle.triggerButton.Both
    }
    return source
  }

  async _handleMouseOverEvent () {
    return game.user.isGM
  }

  async #handleClickEvent (button) {
    for (const uuid of this.drawingUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ hidden: !this.toggle })
      } else {
        console.error('Drawing ' + uuid + ' not loaded')
      }
    }
    const permissionDocument = (!this.toggle ? this.permissionDocumentHide : this.permissionDocument)
    const permissionPage = (!this.toggle ? this.permissionPageHide : this.permissionPage)
    for (const uuid of this.journalEntryUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ 'ownership.default': permissionDocument })
      } else {
        console.error('Journal Entry ' + uuid + ' not loaded')
      }
    }
    for (const uuid of this.journalEntryPageUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ 'ownership.default': permissionPage })
      } else {
        console.error('Journal Entry Page ' + uuid + ' not loaded')
      }
    }
    for (const uuid of this.regionBehaviorUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ disabled: !this.toggle })
      } else {
        console.error('Region Behavior ' + uuid + ' not loaded')
      }
    }
    if (this.triggerButton === ChaosiumCanvasInterfaceDrawingToggle.triggerButton.Both) {
      for (const uuid of this.regionUuids) {
        setTimeout(() => {
          if (button === this.regionButton) {
            if (this.triggerAsButton === ChaosiumCanvasInterface.triggerButton.Right) {
              game.Pendragon.ClickRegionRightUuid(uuid)
            } else if (this.triggerAsButton === ChaosiumCanvasInterface.triggerButton.Left) {
              game.Pendragon.ClickRegionLeftUuid(uuid)
            }
          }
        }, 100)
      }
    }
  }

  async _handleLeftClickEvent () {
    if ([ChaosiumCanvasInterfaceDrawingToggle.triggerButton.Both, ChaosiumCanvasInterface.triggerButton.Left].includes(this.triggerButton)) {
      this.#handleClickEvent(ChaosiumCanvasInterface.triggerButton.Left)
    }
  }

  async _handleRightClickEvent () {
    if ([ChaosiumCanvasInterfaceDrawingToggle.triggerButton.Both, ChaosiumCanvasInterface.triggerButton.Right].includes(this.triggerButton)) {
      this.#handleClickEvent(ChaosiumCanvasInterface.triggerButton.Right)
    }
  }
}
