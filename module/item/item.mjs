import { PENCheck } from '../apps/checks.mjs';

export class PendragonItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }





  //Prepare a data object which is passed to any Roll formulas which are created related to this Item
  getRollData() {
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);
    return rollData;
  }

  //Handle clickable rolls.
  async roll() {
    const item = this;
    const actor = this.actor;
    let altKey = event.altKey;
    let shiftKey = event.shiftKey;
    if (game.settings.get('Pendragon','switchShift')) {
      shiftKey = shiftKey
    }
    let cardType = "NO";
    let rollType = "";
    let skillId = "";
    let itemId = "";
    let subType = "";
    switch (item.type) {
      case 'trait':
        rollType = 'TR'
        subType = 'trait'
        skillId = item._id;
        if (altKey){cardType='OP'}
        break
      case 'passion':
      case 'skill':     
        rollType = 'SK';
        skillId = item._id;
        if (altKey){cardType='OP'}
        break
      case 'weapon':     
        rollType = 'CM';
        cardType = 'CO';
        itemId = item._id
        break    
      default:
        item.sheet.render(true);
        return
    }            

      PENCheck._trigger({
          rollType,
          cardType,
          shiftKey,
          subType,
          skillId,
          itemId,
          event,
          actor
      })
    return
  }
}
