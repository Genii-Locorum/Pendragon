import ChaosiumCanvasInterface from "./chaosium-canvas-interface.mjs";

export default class ChaosiumCanvasInterfaceTileToggle extends ChaosiumCanvasInterface {
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
    return 'fa-solid fa-cubes'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      toggle: new fields.BooleanField({
        initial: false,
        label: 'PEN.ChaosiumCanvasInterface.TileToggle.Toggle.Title',
        hint: 'PEN.ChaosiumCanvasInterface.TileToggle.Toggle.Hint'
      }),
      tileUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          initial: undefined,
          type: 'Tile'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.TileToggle.Tile.Title',
          hint: 'PEN.ChaosiumCanvasInterface.TileToggle.Tile.Hint'
        }
      ),
      journalEntryUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          initial: undefined,
          type: 'JournalEntry'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.TileToggle.JournalEntry.Title',
          hint: 'PEN.ChaosiumCanvasInterface.TileToggle.JournalEntry.Hint'
        }
      ),
      journalEntryPageUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          initial: undefined,
          type: 'JournalEntryPage'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.TileToggle.JournalEntryPage.Title',
          hint: 'PEN.ChaosiumCanvasInterface.TileToggle.JournalEntryPage.Hint'
        }
      ),
      regionBehaviorUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          initial: undefined,
          type: 'RegionBehavior'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.TileToggle.RegionBehavior.Title',
          hint: 'PEN.ChaosiumCanvasInterface.TileToggle.RegionBehavior.Hint'
        }
      ),
      permissionDocument: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        label: 'PEN.ChaosiumCanvasInterface.TileToggle.PermissionDocument.Title',
        hint: 'PEN.ChaosiumCanvasInterface.TileToggle.PermissionDocument.Hint',
        required: true
      }),
      permissionPage: new fields.NumberField({
        choices: Object.keys(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceTileToggle.PERMISSIONS[k]); return c }, {}),
        initial: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
        label: 'PEN.ChaosiumCanvasInterface.TileToggle.PermissionPage.Title',
        hint: 'PEN.ChaosiumCanvasInterface.TileToggle.PermissionPage.Hint',
        required: true
      }),
      regionUuids: new fields.SetField(
        new fields.DocumentUUIDField({
          initial: undefined,
          type: 'Region'
        }),
        {
          label: 'PEN.ChaosiumCanvasInterface.TileToggle.RegionUuids.Title',
          hint: 'PEN.ChaosiumCanvasInterface.TileToggle.RegionUuids.Hint'
        }
      ),
    }
  }

  async _handleMouseOverEvent () {
    return game.user.isGM
  }

  async _handleLeftClickEvent () {
    for (const uuid of this.tileUuids) {
      const doc = await fromUuid(uuid)
      if (doc) {
        await doc.update({ hidden: !this.toggle })
      } else {
        console.error('Tile ' + uuid + ' not loaded')
      }
    }
    const permissionDocument = (!this.toggle ? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE : this.permissionDocument)
    const permissionPage = (!this.toggle ? CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE : this.permissionPage)
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
  }

  async _handleRightClickEvent () {
    await this._handleLeftClickEvent()
    for (const uuid of this.regionUuids) {
      game.Pendragon.ClickRegionLeftUuid(uuid)
    }
  }
}