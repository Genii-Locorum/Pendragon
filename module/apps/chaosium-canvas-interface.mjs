export default class ChaosiumCanvasInterface extends foundry.data.regionBehaviors.RegionBehaviorType {
  static get actionToggles () {
    return {
      [ChaosiumCanvasInterface.actionToggle.On]: 'PEN.ChaosiumCanvasInterface.Actions.Show',
      [ChaosiumCanvasInterface.actionToggle.Off]: 'PEN.ChaosiumCanvasInterface.Actions.Hide',
      [ChaosiumCanvasInterface.actionToggle.Toggle]: 'PEN.ChaosiumCanvasInterface.Actions.Toggle'
    }
  }

  static get actionToggle () {
    return {
      Off: 0,
      On: 1,
      Toggle: 2
    }
  }

  static get triggerButtons () {
    return {
      [ChaosiumCanvasInterface.triggerButton.Left]: 'PEN.ChaosiumCanvasInterface.Buttons.Left',
      [ChaosiumCanvasInterface.triggerButton.Right]: 'PEN.ChaosiumCanvasInterface.Buttons.Right'
    }
  }

  static get triggerButton () {
    return {
      Left: 0,
      Right: 2
    }
  }

  static initSelf () {
    // TODO Remove with v12 support
    if (game.release.generation === 12) {
      class NoteDocumentPolyfill extends CONFIG.Note.documentClass {
        get name () {
          return (this.text?.length ? this.text : this.label)
        }
      }
      CONFIG.Note.documentClass = NoteDocumentPolyfill
      class TileDocumentPolyfill extends CONFIG.Tile.documentClass {
        get name () {
          return this.collectionName + ': ' + this.id
        }
      }
      CONFIG.Tile.documentClass = TileDocumentPolyfill
      class DrawingDocumentPolyfill extends CONFIG.Drawing.documentClass {
        get name () {
          return this.collectionName + ': ' + this.id
        }
      }
      CONFIG.Drawing.documentClass = DrawingDocumentPolyfill
    }

    // TODO Remove with v12 support
    const oldOnClickLeft = (foundry.canvas?.layers?.TokenLayer ?? TokenLayer).prototype._onClickLeft
    // TODO Remove with v12 support
    ;(foundry.canvas?.layers?.TokenLayer ?? TokenLayer).prototype._onClickLeft = function (event) {
      oldOnClickLeft.call(this, event)
      // TODO Remove with v12 support
      if (canvas.activeLayer instanceof (foundry.canvas?.layers?.TokenLayer ?? TokenLayer)) {
        const destination = canvas.activeLayer.toLocal(event)
        for (const region of canvas.scene.regions.contents) {
          // TODO Remove with v12 support
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof ChaosiumCanvasInterface) && (region.object?.document.polygonTree ?? region.object.polygonTree).testPoint(destination)) {
            region.behaviors.filter(b => !b.disabled).map(async (b) => { if (await b.system._handleMouseOverEvent() === true && typeof b.system._handleLeftClickEvent === 'function') { await b.system._handleLeftClickEvent() } })
          }
        }
      }
    }

    // TODO Remove with v12 support
    const oldOnClickRight = (foundry.canvas?.layers?.TokenLayer ?? TokenLayer).prototype._onClickRight
    // TODO Remove with v12 support
    ;(foundry.canvas?.layers?.TokenLayer ?? TokenLayer).prototype._onClickRight = function (event) {
      oldOnClickRight.call(this, event)
      // TODO Remove with v12 support
      if (canvas.activeLayer instanceof (foundry.canvas?.layers?.TokenLayer ?? TokenLayer)) {
        const destination = canvas.activeLayer.toLocal(event)
        for (const region of canvas.scene.regions.contents) {
          // TODO Remove with v12 support
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof ChaosiumCanvasInterface) && (region.object?.document.polygonTree ?? region.object.polygonTree).testPoint(destination)) {
            region.behaviors.filter(b => !b.disabled).map(async (b) => { if (await b.system._handleMouseOverEvent() === true && typeof b.system._handleRightClickEvent === 'function') { await b.system._handleRightClickEvent() } })
          }
        }
      }
    }

    document.body.addEventListener('mousemove', async function (event) {
      // TODO Remove with v12 support
      if (canvas.activeLayer instanceof (foundry.canvas?.layers?.TokenLayer ?? TokenLayer)) {
        const pointer = canvas?.app?.renderer?.events?.pointer
        if (!pointer) {
          return
        }
        const destination = canvas.activeLayer.toLocal(event)
        let setPointer = false
        for (const region of canvas.scene.regions.contents) {
          // TODO Remove with v12 support
          if (region.behaviors.filter(b => !b.disabled).find(b => b.system instanceof ChaosiumCanvasInterface) && (region.object?.document.polygonTree ?? region.object.polygonTree).testPoint(destination)) {
            setPointer = await region.behaviors.filter(b => !b.disabled).reduce(async (c, b) => {
              const r = await b.system._handleMouseOverEvent()
              if (r !== false && r !== true) {
                console.error(b.uuid + ' did not return a boolean')
              }
              c = c || r
              return c
            }, false)
          }
        }
        if (setPointer) {
          document.getElementById('board').style.cursor = 'pointer'
        } else {
          document.getElementById('board').style.cursor = ''
        }
      }
    })
  }

  static async ClickRegionLeftUuid (docUuid) {
    const doc = await fromUuid(docUuid)
    if (doc) {
      doc.behaviors.filter(b => !b.disabled).filter(b => b.system instanceof ChaosiumCanvasInterface).map(async (b) => { if (await b.system._handleMouseOverEvent() === true && typeof b.system._handleLeftClickEvent === 'function') { await b.system._handleLeftClickEvent() } })
    } else {
      console.error('RegionUuid ' + docUuid + ' not loaded')
    }
  }

  static async ClickRegionRightUuid (docUuid) {
    const doc = await fromUuid(docUuid)
    if (doc) {
      doc.behaviors.filter(b => !b.disabled).filter(b => b.system instanceof ChaosiumCanvasInterface).map(async (b) => { if (await b.system._handleMouseOverEvent() === true && typeof b.system._handleRightClickEvent === 'function') { await b.system._handleRightClickEvent() } })
    } else {
      console.error('RegionUuid ' + docUuid + ' not loaded')
    }
  }
}