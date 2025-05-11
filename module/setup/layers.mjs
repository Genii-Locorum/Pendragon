import { PENWinter } from "../apps/winterPhase.mjs"
import { PENCharCreate } from "../apps/charCreate.mjs";
import { PENRollType } from "../cards/rollType.mjs";


export class PENLayer extends foundry.canvas.layers.PlaceablesLayer {

  constructor () {
    super()
    this.objects = {}
  }

  static get layerOptions () {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: 'pendragonmenu',
      zIndex: 60
    })
  }

  static get documentName () {
    return 'Token'
  }

  get placeables () {
    return []
  }
  static prepareSceneControls() {
    return {
      icon: "fas fa-tools",
      layer: "pendragonmenu",
      name: "pendragonmenu",
      title: 'PEN.GMTools',
      visible: game.user.isGM,
      order: 11,
      activeTool: '',
      onChange: (event, active) => {
        if ( active )
        canvas.pendragonmenu.activate();
      },
      onToolChange: () => canvas.pendragonmenu.setAllRenderFlags({refreshState: true}),
      tools: {
        winter: {
          name: "winter",
          order: 1,
          icon: "fas fa-snowflake",
          title:  'PEN.winterPhase',
          active: game.settings.get('Pendragon','winter'),
          toggle: true,
          visible: true,
          onChange: async (event, toggle) => {await PENWinter.winterPhase(toggle)},
        },
        development: {
          name: "development",
          order: 2,
          icon: "fas fa-helmet-battle",
          title:  'PEN.developmentPhase',
          active: game.settings.get('Pendragon','development'),
          toggle: true,
          onChange: async (event, toggle) => {await PENWinter.developmentPhase(toggle)},
        },
        creation: {
          name: "creation",
          order: 3,
          icon: "fas fa-wand-magic-sparkles",
          title:  'PEN.creation',
          active: game.settings.get('Pendragon','creation'),
          toggle: true,
          onChange: async (event, toggle) => {await PENCharCreate.creationPhase(toggle)},
        },
        gmRoll: {
          name: "gmRoll",
          order: 4,
          icon: "fas fa-dice-d20",
          title: 'PEN.gmRoll',
          button: true,
          visible: true,
          onChange: async (event, active) => {
            if ( active ) await PENRollType._onGMRoll(event)
          },
        },
      }
    };
  }
}

export class PENMenu {
  static getButtons (controls) {
    canvas.pendragonmenu = new PENLayer();
    controls.pendragon = PENLayer.prepareSceneControls();
    console.log(controls);
  }

  static renderControls (app, html, data) {
    //const isGM = game.user.isGM;
    //const gmMenu = html.querySelector('.fas-fa-tools').parentElement;
    //gmMenu.classList.add('pendragon-menu');
  }

}



