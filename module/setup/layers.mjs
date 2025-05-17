import { PENWinter } from "../apps/winterPhase.mjs"
import { PENCharCreate } from "../apps/charCreate.mjs";
import { PENRollType } from "../cards/rollType.mjs";


export class PENLayer extends PlaceablesLayer {

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

// used for V12 registration
export class PENMenu {
  static getButtons (controls) {
    canvas.pengmtools = new PENLayer()
    const isGM = game.user.isGM
    controls.push({
      icon: "fas fa-tools",
      layer: "pengmtools",
      name: "pendragonmenu",
      title: game.i18n.localize('PEN.GMTools'),
      visible: isGM,
      tools: [
        {
          name: "Session",
          icon: "fas fa-snowflake",
          title:  game.i18n.localize('PEN.winterPhase'),
          active: game.settings.get('Pendragon','winter'),
          toggle: true,
          visible: true,
          onClick: async toggle => {await PENWinter.winterPhase(toggle)}
        },
        {
          name: "Development",
          icon: "fas fa-helmet-battle",
          title:  game.i18n.localize('PEN.developmentPhase'),
          active: game.settings.get('Pendragon','development'),
          toggle: true,
          onClick: async toggle => await PENWinter.developmentPhase(toggle)
        },
        {
          name: "Creation",
          icon: "fas fa-wand-magic-sparkles",
          title:  game.i18n.localize('PEN.creation'),
          active: game.settings.get('Pendragon','creation'),
          toggle: true,
          onClick: async toggle => await PENCharCreate.creationPhase(toggle)
        },
        {
          name: "GMRoll",
          icon: "fas fa-dice-d20",
          title: game.i18n.localize('PEN.gmRoll'),
          button: true,
          visible: true,
          onClick: async (event) => await PENRollType._onGMRoll(event)
        }
      ]
    })
  }

  static renderControls (app, html, data) {
    const gmMenu = html.find('.fas-fa-tools').parent();
    gmMenu.addClass('pendragon-menu');
  }

}



