import { PENUtilities } from "../apps/utilities.mjs";

export class PENCombat {


  //
  //Treat a Wound - First Aid
  //
  static async treatWound(event) {
    const itemID = event.currentTarget.dataset.itemid;
    const item = this.actor.items.get(itemID);
    let healing = 0
    let usage = await PENCombat.healingAmount (this.actor.name)
    if (usage) {
        healing = Number(usage.get('treat-wound'));
    }
    //If amout of healing is zero then simply ignore and stop
    if (healing === 0) {return}

    //If amount of healing >- wound then simply delete the wound
    if (healing >= item.system.value) {
        item.delete();
        this.render(true)
        return
    }

    //Otherwise reduce the wound score by amount healed (or increase if a negative) and set treated status to true
    let newWound = item.system.value
    let checkProp = {'system.value': item.system.value - healing,
                     'system.treated': true}
    item.update(checkProp)

    //Take the opportunity to delete any wounds with zero damage they may not be visible
    await PENCombat.cleanseWounds(this.actor)
}      


  //
  //Natural Healing
  //
  static async naturalHealing(event) {
    let confirm = await PENUtilities.confirmation(game.i18n.localize('PEN.naturalHeal'))
    if (!confirm) {return}
    let healing = this.actor.system.healRate
    let deterHeal = 0
    let aggravHeal = 0
  //If there is deterioration damage then heal that first
    if (this.actor.system.deterDam > 0) {
      deterHeal = Math.min(healing, this.actor.system.deterDam)
      healing = healing - deterHeal
    }
    if (this.actor.system.aggravDam > 0) {
      aggravHeal = Math.min(healing, this.actor.system.aggravDam)
      healing = healing - aggravHeal
    }  

    await this.actor.update({'system.deterDam': this.actor.system.deterDam - deterHeal,
                             'system.aggravDam': this.actor.system.aggravDam - aggravHeal})

    //Put wounds in array and sort lowest to highest damage
    let wounds=[];
    for (let i of this.actor.items) {
      if(i.type === 'wound'){
        wounds.push(i);
      }
    }
    wounds.sort(function(a, b){
      let x = a.system.value;
      let y = b.system.value;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });

    for (let i of wounds) {
      let woundHeal = Math.min(healing, i.system.value);
      if (woundHeal > 0) {
        const item= this.actor.items.get(i._id);
        await item.update({'system.value': i.system.value - woundHeal});
        healing = healing - woundHeal;
      }  
    }
    await PENCombat.cleanseWounds(this.actor)
  }


  //
  //Delete any wounds that have zero or less damage - they may not be visible on the character sheet
  //
  static async cleanseWounds (actor) {
    for (let i of actor.items) {
      if(i.type === 'wound' && i.system.value < 1){
          i.delete();
    }
  }
}

  //
  // Form to get amount of healing
  //
  static async healingAmount (name) {
    let title = game.i18n.localize('PEN.treat');
    const html = await renderTemplate(
      'systems/Pendragon/templates/dialog/treatWound.html',
      {
      }
    )
    return new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: title,
        content: html,
        buttons: {
          validate: {
            label: game.i18n.localize('PEN.confirm'),
            callback: html => {
              formData = new FormData(
                html[0].querySelector('#treat-wound-form')
              )
              return resolve(formData)
            }
          }
        },
        default: 'validate',
        close: () => {
          return resolve(false)
        }
      }, {classes: ["Pendragon", "sheet"]})
      dlg.render(true)
    })
  }
}