import { PENCheck } from '../apps/checks.mjs';
import {isCtrlKey} from '../apps/helper.mjs'


export class PENRollType {

    //Roll Types
    //CH = Characteristic
    //SK = Skill
    //PA = Passion
    //GL = Glory Roll
    //SQ = Squire Roll
    //TR = Trait
    //DC = Decision (Trait)
    //DM = Damage
    //CM = Combat
    //MV = Move
    //AM = Alternative Move
  
    //Card Types
    //NO = Normnal Roll
    //OP = Opposed Roll
    //CO = Combat Roll
    //RE = Resistance (Fixed Opposed Roll)
  
  
  
    //Start a Stat Check
    static async _onStatCheck(event) {
      let ctrlKey = isCtrlKey(event ?? false);
      let cardType = 'NO';
      let characteristic = event.currentTarget.dataset.stat;
      if (event.altKey){ 
        cardType='OP';
      } else if(ctrlKey){ 
        cardType='RE'
      }
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'CH',
          cardType,
          characteristic,
          shiftKey: event.shiftKey,
          actor: this.actor,
          token: this.token
      })
    }
  
    //Start a GM Roll
    static async _onGMRoll() {
      let shiftKey = event.shiftKey
      if (!game.user.isGM) {
        ui.notifications.error(game.i18n.format('PEN.notGM')) 
        return
      }
      let cardType="OP"
      let gmRollName = "GM"
      let gmRollScore = 10
      let rollType = "SK"

      let usage = await PENRollType.GMRollDialog()
      if (usage) {
        cardType = usage.get('rollType')
        gmRollName = usage.get('particName')
        gmRollScore = usage.get('score')
      } else {
        return
      }
      if (game.settings.get('Pendragon','switchShift')) {
        shiftKey = !shiftKey
      }

      if (cardType === "CO") {
        rollType = "CM"
      }

      PENCheck._trigger({
          rollType,
          cardType,
          gmRollName,
          gmRollScore,
          shiftKey: shiftKey,
          neutralRoll: true
      }) 
    }


    //Start a Skill Check
    static async _onSkillCheck(event) {
      let ctrlKey = isCtrlKey(event ?? false);
      let cardType = 'NO';
      let skillId = event.currentTarget.dataset.itemid;
      if (event.altKey){ 
        cardType='OP';
      } else if(ctrlKey){ 
        cardType='RE'
      }
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'SK',
          cardType,
          skillId,
          shiftKey: event.shiftKey,
          actor: this.actor,
          token: this.token
      })
    }
  
    //Start a Passion Check
    static async _onPassionCheck(event) {
      let ctrlKey = isCtrlKey(event ?? false);
      let cardType = 'NO';
      let skillId = event.currentTarget.dataset.itemid;
      let flatMod = 0;
      let passion = this.actor.items.get(skillId)
      if (passion.flags.Pendragon.pidFlag.id === 'i.passion.honour') {
        flatMod = passion.system.dishonour
      }
      if (event.altKey){ 
        cardType='OP';
      } else if(ctrlKey){ 
        cardType='RE'
      }
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'PA',
          cardType,
          skillId,
          flatMod,
          shiftKey: event.shiftKey,
          actor: this.actor,
          token: this.token
          
      })
    }

    //Start a Glory Check
    static async _onGloryCheck(event) {
      let ctrlKey = isCtrlKey(event ?? false);
      let cardType = 'NO';
      if (event.altKey){ 
        cardType='OP';
      } else if(ctrlKey){ 
        cardType='RE'
      }
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'GL',
          cardType,
          shiftKey: event.shiftKey,
          actor: this.actor,
          token: this.token
      })
    }
  
    //Start a Move Check
    static async _onMoveCheck(event) {
      let ctrlKey = isCtrlKey(event ?? false);
      let cardType = 'NO';
      let rollType = 'MV';
      if (event.currentTarget.dataset.property === 'altmove') {
        rollType="AM"
      }
      if (event.altKey){ 
        cardType='OP';
      } else if(ctrlKey){ 
        cardType='RE'
      }
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType,
          cardType,
          shiftKey: event.shiftKey,
          actor: this.actor,
          token: this.token
      })
    }



    //Start a Squire Check
    static async _onSquireCheck(event) {
      let ctrlKey = isCtrlKey(event ?? false);
      let subType = event.currentTarget.dataset.type
      let cardType = 'NO';
      let itemId = event.currentTarget.dataset.itemid;
      if (event.altKey){ 
        cardType='OP';
      } else if(ctrlKey){ 
        cardType='RE'
      }
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'SQ',
          cardType,
          shiftKey: event.shiftKey,
          itemId,
          subType,
          actor: this.actor,
          token: this.token
      })
    }
  
    //Start a Trait Check
    static async _onTraitCheck(event) {
      let ctrlKey = isCtrlKey(event ?? false);
      let cardType = 'NO';
      let subType = event.currentTarget.dataset.type
      let skillId = event.currentTarget.dataset.itemid;
      if (event.altKey){ 
        cardType='OP';
      } else if(ctrlKey){ 
        cardType='RE'
      }
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'TR',
          cardType,
          subType,
          shiftKey: event.shiftKey,
          skillId,
          actor: this.actor,
          token: this.token
      })
    }  
    
    //Start a Decision Trait Check
    static async _onDecisionCheck(event) {
      let cardType = 'NO';
      let skillId = event.currentTarget.dataset.itemid;
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'DC',
          cardType,
          shiftKey: event.shiftKey,
          skillId,
          actor: this.actor,
          token: this.token
      })
    }  
  
    //Start a Damage Roll
    static async _onDamageRoll(event) {
      let damCrit = false
      if (event.altKey){ 
        damCrit = true;
      }
      let cardType = 'NO';
      let itemId = event.currentTarget.dataset.itemid;
      PENCheck._trigger({
          rollType: 'DM',
          cardType,
          shiftKey: event.shiftKey,
          itemId,
          damCrit,
          actor: this.actor,
          token: this.token
      })
    }
  
    //Start a Combat Check
    static async _onCombatCheck(event) {
      let cardType = 'CO';
      let itemId = event.currentTarget.dataset.itemid;
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'CM',
          cardType,
          shiftKey: event.shiftKey,
          itemId,
          actor: this.actor,
          token: this.token
      })
    }

  //Function to call the GM Roll Dialog box 
  static async GMRollDialog (options) {
    const data = {
    }
    const html = await renderTemplate('systems/Pendragon/templates/dialog/gmRollOptions.html',data);
    return new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: game.i18n.localize('PEN.gmRoll'),
        content: html,
        buttons: {
          roll: {
            label: game.i18n.localize("PEN.rollDice"),
            callback: html => {
            formData = new FormData(html[0].querySelector('#check-gmroll-form'))
            return resolve(formData)
            }
          }
        },
      default: 'roll',
      close: () => {}
      },{classes: ["Pendragon", "sheet"]})
      dlg.render(true);
    })
  }  


}  