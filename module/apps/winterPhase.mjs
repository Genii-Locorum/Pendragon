import { PENUtilities } from "./utilities.mjs";
import { WinterSelectDialog } from "./winter-select-dialog.mjs";

export class PENWinter {

  //
  //Winter Phase
  //
  static async winterPhase(toggle) {

    await game.settings.set('Pendragon', 'winter', toggle)

    //If Winter Phase toggled off - toggle Winter status off for all characters and increase game year 
    if (!toggle) {
      for (const a of game.actors.contents) {
        if(a.type === 'character') {
          await a.update({'system.status.train': false});
        }
      }        
    //Update the game year by one 
    let year = game.settings.get('Pendragon',"gameYear") + 1;
    game.settings.set('Pendragon',"gameYear",year);
    
    ui.notifications.warn(game.i18n.localize('PEN.winterPhaseEnd'))
    return
    }

    //If Winter Phase toggled on
      //Add one year to age and turn winter phase and training on for Characters
      for (const a of game.actors.contents) {
      if(a.type === 'character') {
        await a.update({'system.age' : a.system.age + 1,
                  'system.status.train': true});
  
        //Create a history event for each character with this year's passive glory
        const type = 'history'
        const name = `${type.capitalize()}`;
        const itemData = {
          name: name,
          type: type,
          system: {
            "libra": 0,
            "denarii": 0,
            "description": game.i18n.localize('PEN.winterPhase'),
            "year": game.settings.get('Pendragon',"gameYear"),
            "glory": a.system.passive
          }
        };
        let item = await Item.create(itemData, {parent: a});
        }      
      }    
      ui.notifications.warn(game.i18n.localize('PEN.winterPhaseStart'))

    }  

  //
  //Turn on Development without full Winter Phase
  //
  static async developmentPhase(toggle) {
  
    await game.settings.set('Pendragon', 'development', toggle)
    for (const a of game.actors.contents) {
      if(a.type === 'character') {
        await a.update({'system.status.train': toggle});
      }
    }  
  }

  //
  //Experience Checks
  //
  static async xpCheck(event) { 
    let success=[];
    for (let i of this.actor.items) {
      if (i.type === 'skill' || i.type === 'trait' || i.type === 'passion') {
        if (i.system.XP) {
          let result = await PENWinter.xpRoll(i.system.value)
          let newRes = {'type' : game.i18n.localize("PEN."+i.type),
                        'name' : i.name,
                        'roll' : result.dice,
                        'result': result.level}
            await i.update ({'system.value': Number(i.system.value) + result.level,
                             'system.XP': false })
          success.push(newRes);
        }
        if (i.type === 'trait' && i.system.oppXP){
          let result = await PENWinter.xpRoll(i.system.oppvalue)
          let newRes = {'type' : game.i18n.localize("PEN."+i.type),
                        'name' : i.system.oppName,
                        'roll' : result.dice,
                        'result': Number(result.level)}
            await i.update ({'system.value': Number(i.system.value) - result.level,
                            'system.oppXP': false})
          success.push(newRes);
        }
      }
    }
    //If no stats were checked for improvement then no chat message needed
    if (success.length < 1) {
      ui.notifications.warn(game.i18n.localize('PEN.noImprovements'))
      return
    }
    const html = await PENWinter.xpChatCard(success, this.actor.name);
    let msg = await PENWinter.showXPChat (html,this.actor)
  }  

  //
  //XP Check Dice Roll
  //
  static async xpRoll(target) {
    let resultLevel = 0
    let roll = new Roll('1D20');
    await roll.roll({ async: true});
    if (Number(roll.total) > target) {
      resultLevel = 1
    }


    return ({'level': resultLevel, 'dice': Number(roll.total)})
  }

  //
  //Prepare XP Roll Chat Card
  // 
  static async xpChatCard (success, actorName) {
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actorName }),
      success: success
    }
      const messageTemplate = 'systems/Pendragon/templates/chat/XP-result.html'
      let html = await renderTemplate (messageTemplate, messageData);
 
     return html;

  }

  //
  // Display the XP chat card
  //
  static async showXPChat(html, actor) {

    let chatData={};
      chatData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        content: html,
        speaker: {
          actor: actor._id,
          alias: actor.name,
        },
      }
    let msg = await ChatMessage.create(chatData);
    return 
  }

  //
  // Spend prestige - put together a list of all items that can be chose.  Add two variables selected
  // and choice.  Selected indicates the stat picked and choice is increase or decrease +1/-1
  //
  static async winterImprov(route, event) {
 
    if (route === 'prestige' && this.actor.system.gloryPrestige < 1) {
      ui.notifications.warn (game.i18n.localize('PEN.noPrestige'));
      return
    }
    if (route != 'prestige' && !this.actor.system.status.train) {
      ui.notifications.warn (game.i18n.localize('PEN.noTrain'));
      return
    }
    let options = [];
    for (let [key, stat] of Object.entries(this.actor.system.stats)) {
      //For prestige choice add all characteristics, for single training add all except for Size and only if value <20
      if (route === 'prestige' || (route === 'single' && key != 'siz' && stat.value<20)) {
        let option = {
          'type': 'stat',
          'label': game.i18n.localize("PEN.characteristic"),
          'itemID': key,
          'name' : stat.label + " (" + stat.value + ")",
          'value': stat.value,
          'choice': 0,
          'max': 20,
          'min': stat.value
        }
      if (route === 'prestige') {option.max = 999}  
      options.push(option);
      }
    } 

    for (let i of this.actor.items) {
      if (i.type === "passion" || i.type === 'skill' || i.type === 'trait') {
        //If route is prestige add all, if single train add all where skill > 14, for multiple train only add skill where <15
        if ((route === 'prestige') || (route === 'single' && i.type != 'skill') || (route === 'single' && i.type === 'skill' && i.system.value > 14 && i.system.value < 20) ||(route === 'multiple' && i.type === 'skill' && i.system.value < 15)){        
          let option = {
            'type': i.type,
            'label': game.i18n.localize("PEN."+i.type),
            'itemID': i._id,
            'name' : i.name + " (" + i.system.value +")",
            'value': i.system.value,
            'choice': "",
            'max': 20,
            'min': 1
          }

          //If a skill and presitge aware no maximum. If multiple then max = 15.  Otherwise single training and max is the default of 20
          //Can't decrease skills to the minimum is skill value
          if (i.type === 'skill') { 
            option.min = i.system.value;
            if (route === 'prestige') {
              option.max = 999;
            } else if (route === 'multiple') {
              option.max = 15;  
            }
          }

          // For traits the range is always 0-20, except for Prestige with no max or min          
          if (i.type === 'trait') {
            option.min = 0;
          }
          if (i.type === 'trait' && route === 'prestige') {
            option.min = -999;
            option.max = 999;
          }

          // For passions range is 1-20 except for Prestige reward when there is no max
          if (i.type === 'passion' && route === 'prestige'){
            option.max = 999;
          }

          options.push(option);  
        }
      }
    }
      
    // Sort Options
    options.sort(function(a, b){
      let x = a.name.toLowerCase();
      let y = b.name.toLowerCase();
      let p = a.label;
      let q = b.label;
      if (p < q) {return -1};
      if (p > q) {return 1};
      if (x < y) {return -1};
      if (x > y) {return 1};
      return 0;
    });  

    //If prestinge or single training point then amount = 1, otherwise can choose 6 points  
    let amount = 1;
    if (route === 'multiple') {amount = 6};
    let title = game.i18n.localize('PEN.prestigeAward');
    if (route != 'prestige') {title = game.i18n.localize('PEN.training')}

    const selected = await WinterSelectDialog.create (title, options, this.actor.name, amount);
    console.log(selected)
      if (selected.length <1 || !selected) {
        ui.notifications.warn(game.i18n.localize('PEN.noSelection'));
        return
      }
      //Picked is the selected item
      let pickedName = "";
      for (let picked of selected) {
        if( pickedName != "") {
          pickedName = pickedName + ", ";
        }
        //If a stat then increase by 1
        if (picked.type === 'stat') { 
          let target = 'system.stats.' + picked.itemID + '.value';
          pickedName = pickedName + this.actor.system.stats[picked.itemID].label +"(1)";
          await this.actor.update({[target] : this.actor.system.stats[picked.itemID].value + 1});

          //Otherwise change the item value the value of .choice
        } else {
          let item = this.actor.items.get(picked.itemID);
          pickedName = pickedName + item.name +"(" + picked.choice + ")";
          await item.update({'system.value': Number(item.system.value) + Number(picked.choice)});
        }  
      }

      //Increase the number of presitge points spent by 1
      if (route === 'prestige') {
        pickedName = game.i18n.localize('PEN.prestigeAward') +": "+ pickedName;
        await this.actor.update({'system.prestige': this.actor.system.prestige + 1});
      } else {
        pickedName = game.i18n.localize('PEN.training') +": "+ pickedName;
        await this.actor.update ({'system.status.train' :false});
      }  

        //Add a History Item to show the spend
        const type = 'history'
        const name = `${type.capitalize()}`;
        const itemData = {
          name: name,
          type: type,
          system: {
            "libra": 0,
            "denarii": 0,
            "description": pickedName,
            "year": game.settings.get('Pendragon',"gameYear"),
            "glory": 0
          }
        }
        await Item.create(itemData, {parent: this.actor});
     
  }  

}    