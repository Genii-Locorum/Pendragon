import { PENCheck } from '../apps/checks.mjs';
import {isCtrlKey} from '../apps/helper.mjs'

export class PendragonItem extends Item {
  constructor (data, context) {
    if (typeof data.img === 'undefined') {
      if (data.type === 'skill') {
        data.img = 'icons/svg/book.svg'
      } else if (data.type === 'trait') {
        data.img = 'systems/Pendragon/assets/Icons/knight-banner.svg'
      } else if (data.type === 'passion') {
        data.img = 'systems/Pendragon/assets/Icons/hearts.svg'
      } else if (data.type === 'horse') {
        data.img = 'systems/Pendragon/assets/Icons/horse-head.svg'
      } else if (data.type === 'armour') {
        data.img = 'systems/Pendragon/assets/Icons/shoulder-armor.svg'
      } else if (data.type === 'weapon') {
        data.img = 'systems/Pendragon/assets/Icons/axe-sword.svg'
      } else if (data.type === 'family') {
        data.img = 'systems/Pendragon/assets/Icons/griffin-shield.svg'
      } else if (data.type === 'gear') {
        data.img = 'icons/svg/item-bag.svg'
      } else if (data.type === 'culture') {
        data.img = 'systems/Pendragon/assets/Icons/trumpet-flag.svg'
      } else if (data.type === 'religion') {
        data.img = 'systems/Pendragon/assets/Icons/church.svg'
      } else if (data.type === 'class') {
        data.img = 'systems/Pendragon/assets/Icons/mounted-knight.svg'
      } else if (data.type === 'homeland') {
        data.img = 'systems/Pendragon/assets/Icons/scroll-unfurled.svg'
      } else if (data.type === 'ideal') {
        data.img = 'systems/Pendragon/assets/Icons/holy-grail.svg'
      } else if (data.type === 'relationship') {
        data.img = 'systems/Pendragon/assets/Icons/tabletop-players.svg'
      } else if (data.type === 'squire') {
        data.img = 'systems/Pendragon/assets/Icons/battle-gear.svg'
      }
    }
    super(data, context)
  }

  static async createDialog(data={}, createOptions={}, { types, ...options }={}) {
//Enter the document types you want to remove from the side bar create option - 'base' is removed in the super
const invalid = ["wound", "family", "squire", "relationship"]; //
if (!types) types = this.TYPES.filter(type => !invalid.includes(type));
else types = types.filter(type => !invalid.includes(type));
return super.createDialog(data, createOptions, { types, ...options });
}

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
    let ctrlKey = isCtrlKey(event ?? false);
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
        if (altKey){
          cardType='OP'
        } else if(ctrlKey){ 
          cardType='RE'
        }
        break
      case 'passion':
      case 'skill':     
        rollType = 'SK';
        skillId = item._id;
        if (altKey){
          cardType='OP'
        } else if(ctrlKey){ 
          cardType='RE'
        }
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
