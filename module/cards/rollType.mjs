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
  
    //Card Types
    //NO = Normnal Roll
    //OP = Opposed Roll
    //CO = Combat Roll
  
  
  
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
      if (event.altKey){ 
        cardType='OP';
      } else if(ctrlKey){ 
        cardType='RE'
      }
      if (game.settings.get('Pendragon','switchShift')) {
        event.shiftKey = !event.shiftKey
      }
      PENCheck._trigger({
          rollType: 'MV',
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

}  