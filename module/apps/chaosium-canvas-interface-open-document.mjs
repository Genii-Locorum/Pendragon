import ChaosiumCanvasInterface from "./chaosium-canvas-interface.mjs";

export default class ChaosiumCanvasInterfaceOpenDocument extends ChaosiumCanvasInterface {
  static get PERMISSIONS () {
    return {
      ALWAYS: 'PEN.ChaosiumCanvasInterface.Permission.Always',
      DOCUMENT: 'PEN.ChaosiumCanvasInterface.Permission.Document',
      GM: 'PEN.ChaosiumCanvasInterface.Permission.GM'
    }
  }

  static get icon () {
    return 'fa-solid fa-book-atlas'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      permission: new fields.StringField({
        blank: false,
        choices: Object.keys(ChaosiumCanvasInterfaceOpenDocument.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceOpenDocument.PERMISSIONS[k]); return c }, {}),
        initial: 'GM',
        label: 'PEN.ChaosiumCanvasInterface.OpenDocument.Permission.Title',
        hint: 'PEN.ChaosiumCanvasInterface.OpenDocument.Permission.Hint',
        required: true
      }),
      documentUuid: new fields.DocumentUUIDField({
        label: 'PEN.ChaosiumCanvasInterface.OpenDocument.Document.Title',
        hint: 'PEN.ChaosiumCanvasInterface.OpenDocument.Document.Hint'
      }),
      anchor: new fields.StringField({
        label: 'PEN.ChaosiumCanvasInterface.OpenDocument.Anchor.Title',
        hint: 'PEN.ChaosiumCanvasInterface.OpenDocument.Anchor.Hint'
      })
    }
  }

  async _handleMouseOverEvent () {
    switch (this.permission) {
      case 'ALWAYS':
        return true
      case 'GM':
        return game.user.isGM
      case 'DOCUMENT':
        if (game.user.isGM) {
          return true
        }
        if (this.documentUuid) {
          return (await fromUuid(this.documentUuid)).testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER) ?? false
        }
    }
    return false
  }

  async _handleLeftClickEvent () {
    if (this.documentUuid) {
      const doc = await fromUuid(this.documentUuid)
      if (doc?.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
        if (doc instanceof JournalEntryPage) {
          doc.parent.sheet.render(true, { pageId: doc.id, anchor: this.anchor })
        } else {
          doc.sheet.render(true)
        }
      } else {
        console.error('Document ' + this.documentUuid + ' not loaded')
      }
    }
  }
}