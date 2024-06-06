import { PENWinter } from "../apps/winterPhase.mjs"
import { PENCharCreate } from "../apps/charCreate.mjs";



class PENLayer extends PlaceablesLayer {

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
 
}

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
        }
      ]
    })
  }

  static renderControls (app, html, data) {
    const isGM = game.user.isGM
    const gmMenu = html.find('.fas-fa-tools').parent()
    gmMenu.addClass('pendragon-menu')
  }

}



 