import { PENCharCreate } from "../apps/charCreate.mjs";

export class PENactorItemDrop {

  // Change default on Drop Item Create routine for requirements (single items and folder drop)-----------------------------------------------------------------
  static async _PENonDropItemCreate(actor,itemData) {
    const newItemData = [];
    itemData = itemData instanceof Array ? itemData : [itemData];
    //TODO: Consider adding a bypass to just create the items with no checks
    //      return actor.createEmbeddedDocuments("Item", itemData);
    for (let dropItm of itemData) {
      let reqResult = 1;
      let errMsg = "";
    //Automatically allow items in this list to be added
    if (!["gear","armour","weapon"].includes(dropItm.type)) {   
      
      //Test for a duplicate item for certain types
      if (["culture","homeland","class","religion"].includes(dropItm.type)){
        if (actor.items.filter(aItm=>aItm.type===dropItm.type).length>0) {
          reqResult = 0
          errMsg = game.i18n.format('PEN.dupItemType', {name: game.i18n.localize('PEN.Entities.'+ `${dropItm.type.capitalize()}`)})
        }
      }

      //Test for a duplicate named item for certain types
      if (["skill","trait","passion"].includes(dropItm.type)){
        if (actor.items.filter(aItm=>aItm.type===dropItm.type && aItm.name === dropItm.name).length>0) {
          reqResult = 0
          errMsg = game.i18n.format('PEN.dupItemName', {name: dropItm.name, type:game.i18n.localize('PEN.Entities.'+ `${dropItm.type.capitalize()}`)})
        }
      }

      //If an Ideal then check if requirements met
      if (["ideal"].includes (dropItm.type)){
        let success = await PENactorItemDrop.checkIdeal(actor,dropItm)
        if (!success.outcome) {
          reqResult = 0
          errMsg = success.msg
        }
      }


    }  
    //Check to see if we can drop the Item
      if (reqResult !=1) {
        ui.notifications.warn(errMsg);
      } else {
        //If a skill calculate the base score
        if (dropItm.type === 'skill') {
          let score = dropItm.system.base.mod
          if (dropItm.system.base.stat != 'none') {
            score = Number(score) + Number(Math.round((actor.system[dropItm.system.base.stat].value + actor.system[dropItm.system.base.stat].culture)  * dropItm.system.base.multi))
          }
          score = Math.max(score,0)
          dropItm.system.value = score
        }


        newItemData.push(dropItm);
        //If succesfully pushed are there any special rules needed to be applied
        if (dropItm.type === 'culture') {
          await PENCharCreate.addCulture(actor,dropItm)
        } else if (dropItm.type === 'homeland') {
          await PENCharCreate.addHomeland(actor,dropItm)
        } else if (dropItm.type === 'class') {
          await PENCharCreate.addClass(actor,dropItm,true)
        } else if (dropItm.type === 'religion') {
          await PENCharCreate.addReligion(actor,dropItm)
        } 
      }
    }  
    return (newItemData);
  }
 
  //Check if Ideal requirements are met
  static async checkIdeal(actor,ideal) {
    //Test Trait Group total
    let traitTotal = 0
    let traits = await ideal.system.traitGroup.map(itm=> itm.pid)
    let scores = await actor.items.filter(itm=>traits.includes(itm.flags.Pendragon.pidFlag.id)).map(itm=>itm.system.total)
    for (let score of scores) {
      traitTotal = traitTotal + Number(score)
    }
    if (traitTotal < ideal.system.traitGroupScore){
      return ({outcome: false,
               msg: game.i18n.format('PEN.notEnoughTrait',{name:ideal.name})})
    }
    //Test requirements
    for (let rItm of ideal.system.require) {
      let actItm = actor.items.filter(itm=>itm.flags.Pendragon.pidFlag.id === rItm.pid)[0]
      if (!actItm) {
        return ({outcome: false,
          msg: game.i18n.format('PEN.notEnoughReq',{name:ideal.name})})
      }  
      if (rItm.score <0) {
        if (actItm.system.total > 20+rItm.score) {
          return ({outcome: false,
            msg: game.i18n.format('PEN.notEnoughReq',{name:ideal.name})})}  
      } else {
        if (actItm.system.total < rItm.score) {
          return ({outcome: false,
            msg: game.i18n.format('PEN.notEnoughReq',{name:ideal.name})})}
      }
    }  
    return ({outcome: true,
    msg : ""})
  }

}