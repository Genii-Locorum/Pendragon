import ChaosiumCanvasInterfaceDrawingToggle from "./chaosium-canvas-interface-drawing-toggle.mjs";
import ChaosiumCanvasInterfaceMapPinToggle from "./chaosium-canvas-interface-map-pin-toggle.mjs";
import ChaosiumCanvasInterfaceOpenDocument from "./chaosium-canvas-interface-open-document.mjs";
import ChaosiumCanvasInterfaceToScene from "./chaosium-canvas-interface-to-scene.mjs";
import ChaosiumCanvasInterfaceTileToggle from "./chaosium-canvas-interface-tile-toggle.mjs";
import ChaosiumCanvasInterface from "./chaosium-canvas-interface.mjs";

export default class ChaosiumCanvasInterfaceInit extends ChaosiumCanvasInterface {
  static initSelf () {
    const known = [
      ChaosiumCanvasInterfaceDrawingToggle,
      ChaosiumCanvasInterfaceMapPinToggle,
      ChaosiumCanvasInterfaceOpenDocument,
      ChaosiumCanvasInterfaceToScene,
      ChaosiumCanvasInterfaceTileToggle
    ]

    super.initSelf()
    const dataModels = {}
    const typeIcons = {}
    const types = []
    for (const cci of known) {
      const name = (new cci).constructor.name
      dataModels[name] = cci
      typeIcons[name] = cci.icon
      types.push(name)
    }

    Object.assign(CONFIG.RegionBehavior.dataModels, dataModels)

    Object.assign(CONFIG.RegionBehavior.typeIcons, typeIcons)

    // TODO Remove with v12 support
    ;(foundry.applications.apps?.DocumentSheetConfig ?? DocumentSheetConfig).registerSheet(
      RegionBehavior,
      'Pendragon',
      foundry.applications.sheets.RegionBehaviorConfig,
      {
        types: types,
        makeDefault: true
      }
    )
  }
}