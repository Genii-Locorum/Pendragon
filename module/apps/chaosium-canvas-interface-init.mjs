import ChaosiumCanvasInterfaceMapPinToggle from "./chaosium-canvas-interface-map-pin-toggle.mjs";
import ChaosiumCanvasInterfaceOpenDocument from "./chaosium-canvas-interface-open-document.mjs";
import ChaosiumCanvasInterfaceToScene from "./chaosium-canvas-interface-to-scene.mjs";
import ChaosiumCanvasInterfaceTileToggle from "./chaosium-canvas-interface-tile-toggle.mjs";
import ChaosiumCanvasInterface from "./chaosium-canvas-interface.mjs";

export default class ChaosiumCanvasInterfaceInit extends ChaosiumCanvasInterface {
  static initSelf () {


    if (!foundry.utils.isNewerVersion(game.version, '13')) {
      return
    }

    const known = [
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

    foundry.applications.apps.DocumentSheetConfig.registerSheet(
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