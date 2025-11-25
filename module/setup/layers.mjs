import { PENWinter } from "../apps/winterPhase.mjs"
import { PENCharCreate } from "../apps/charCreate.mjs";
import { PENRollType } from "../cards/rollType.mjs";
import { PendragonBattleSheet } from "../actor/sheets/battle.mjs";


export class PENLayer extends foundry.canvas.layers.InteractionLayer {

  constructor () {
    super()
  }

  static get layerOptions () {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: 'pendragonmenu'
    })
  }

  // hide the dummy tool
  static renderControls (app, html, data) {
    const dummy_item = html.querySelector('[data-tool="pendummy"]');
    if(dummy_item) {
      dummy_item.parentElement.remove();
    }
  }

  // we don't have any interactive children for this layer
  // so turn this flag back off when activated
  _activate() {
    this.interactiveChildren = false;
  }

  static prepareSceneControls() {
    return {
      icon: "fas fa-tools",
      layer: "pendragonmenu",
      name: "pendragonmenu",
      title: 'PEN.GMTools',
      visible: game.user.isGM,
      order: 11,
      activeTool: 'pendummy',
      onChange: () => {},
      onToolChange: () => {},
      tools: {
        // this dummy tool exists because we have no sensible default tool when switching to this layer
        // it is hidden by the "PENLayer.renderControls" hook
        pendummy: {
          name: "pendummy",
          order: 0,
          icon: "",
          title:  '',
          button: true,
          onChange: async (event, toggle) => {},
        },
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
        resetEnc: {
          name: "resetEnc",
          order: 5,
          icon: "fas fa-flag-pennant",
          title: 'PEN.resetEnc',
          button: true,
          visible: true,
          onChange: async (event, active) => {
            if ( active ) await PendragonBattleSheet.resetEnc(event)
          },
        },                   
      }
    };
  }
}

