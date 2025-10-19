import ChaosiumCanvasInterface from "./chaosium-canvas-interface.mjs";

export default class ChaosiumCanvasInterfaceToScene extends ChaosiumCanvasInterface {
  static get PERMISSIONS () {
    return {
      ALWAYS: 'PEN.ChaosiumCanvasInterface.Permission.Always',
      GM: 'PEN.ChaosiumCanvasInterface.Permission.GM',
      SEE_TILE: 'PEN.ChaosiumCanvasInterface.Permission.SeeTile'
    }
  }

  static get icon () {
    return 'fa-solid fa-map'
  }

  static defineSchema () {
    const fields = foundry.data.fields
    return {
      triggerButton: new fields.NumberField({
        choices: ChaosiumCanvasInterface.triggerButtons,
        initial: ChaosiumCanvasInterface.triggerButton.Left,
        label: 'PEN.ChaosiumCanvasInterface.ToScene.Button.Title',
        hint: 'PEN.ChaosiumCanvasInterface.ToScene.Button.Hint'
      }),
      permission: new fields.StringField({
        blank: false,
        choices: Object.keys(ChaosiumCanvasInterfaceToScene.PERMISSIONS).reduce((c, k) => { c[k] = game.i18n.localize(ChaosiumCanvasInterfaceToScene.PERMISSIONS[k]); return c }, {}),
        initial: 'GM',
        label: 'PEN.ChaosiumCanvasInterface.ToScene.Permission.Title',
        hint: 'PEN.ChaosiumCanvasInterface.ToScene.Permission.Hint',
        required: true
      }),
      sceneUuid: new fields.DocumentUUIDField({
        label: 'PEN.ChaosiumCanvasInterface.ToScene.Scene.Title',
        hint: 'PEN.ChaosiumCanvasInterface.ToScene.Scene.Hint',
        type: 'Scene'
      }),
      tileUuid: new fields.DocumentUUIDField({
        label: 'PEN.ChaosiumCanvasInterface.ToScene.Tile.Title',
        hint: 'PEN.ChaosiumCanvasInterface.ToScene.Tile.Hint',
        type: 'Tile'
      })
    }
  }

  async _handleMouseOverEvent () {
    switch (this.permission) {
      case 'ALWAYS':
        return true
      case 'GM':
        return game.user.isGM
      case 'SEE_TILE':
        if (game.user.isGM) {
          return true
        }
        if (this.tileUuid) {
          return !(await fromUuid(this.tileUuid)).hidden
        }
    }
    return false
  }

  async #handleClickEvent () {
    const doc = await fromUuid(this.sceneUuid)
    if (doc) {
      setTimeout(() => {
        doc.view()
      }, 100)
    } else {
      console.error('Scene ' + this.sceneUuid + ' not loaded')
    }
  }

  async _handleLeftClickEvent() {
    if (this.sceneUuid && this.triggerButton === ChaosiumCanvasInterface.triggerButton.Left) {
      this.#handleClickEvent()
    }
  }

  async _handleRightClickEvent() {
    if (this.sceneUuid && this.triggerButton === ChaosiumCanvasInterface.triggerButton.Right) {
      this.#handleClickEvent()
    }
  }
}
