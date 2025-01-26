import { PENUtilities } from "./utilities.mjs";
import { WinterSelectDialog } from "./winter-select-dialog.mjs";
import { TraitsSelectDialog } from "./trait-selection.mjs";
import { PENSelectLists } from "./select-lists.mjs";
import { PENCheck } from '../apps/checks.mjs';
import { PENCharCreate } from "./charCreate.mjs";

export class PENWinter {

  //
  //Winter Phase
  //
  static async winterPhase(toggle) {

    await game.settings.set('Pendragon', 'winter', toggle)

    //If Winter Phase toggled off - toggle Winter status off for all characters and increase game year
    if (!toggle) {
      for (const actr of game.actors.contents) {
        if(actr.type === 'character') {
          await actr.update({
            'system.status.train': false,
            'system.status.economic': false,
            'system.status.aging': false,
            'system.status.squireAge': false,
            'system.status.horseSurv': false,
            'system.status.familyRoll': false,
            'system.status.xp': false
          });
        }
        let squires = await actr.items.filter(itm=>itm.type==='squire').map(itm=>{return {_id:itm.id, 'system.age': itm.system.age+1}})
        await Item.updateDocuments(squires, {parent: actr})



      }
    //Update the game year by one
    let year = game.settings.get('Pendragon',"gameYear") + 1;
    game.settings.set('Pendragon',"gameYear",year);

    ui.notifications.warn(game.i18n.localize('PEN.winterPhaseEnd'))
    return
    }

    //If Winter Phase toggled on
      //Turn winter phase off and training on for Characters and create history
      for (const a of game.actors.contents) {
      if(a.type === 'character') {
        await a.update({'system.status.train': true,
                        'system.status.economic': true,
                        'system.status.aging': true,
                        'system.status.squireAge': true,
                        'system.status.horseSurv': true,
                        'system.status.familyRoll': true,
                        'system.status.xp': true});

        //Create a history event for each character with this year's passive glory
        const type = 'history'
        const name = `${type.capitalize()}`;
        const itemData = {
          name: name,
          type: type,
          system: {
            "description": game.i18n.localize('PEN.winterPhase'),
            "source" : "winter",
            "year": game.settings.get('Pendragon',"gameYear"),
            "glory": a.system.passive
          }
        };
        let item = await Item.create(itemData, {parent: a});
        let key = await game.system.api.pid.guessId(item)
        await item.update({'flags.Pendragon.pidFlag.id': key,
                             'flags.Pendragon.pidFlag.lang': game.i18n.lang,
                             'flags.Pendragon.pidFlag.priority': 0})
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
        await a.update({'system.status.train': toggle,
                        'system.status.economic': toggle,
                        'system.status.aging': toggle,
                        'system.status.squireAge': toggle,
                        'system.status.horseSurv': toggle,
                        'system.status.familyRoll': toggle,
                        'system.status.xp': toggle});
      }
    }
  }

  //
  //Experience Checks
  //
  static async xpCheck(event) {
    let success=[];
    for (let i of this.actor.items) {
      if (['skill','trait','passion'].includes(i.type)) {
        if (i.system.XP) {
          let result = await PENWinter.xpRoll(i.system.total)
          let newRes = {'type' : game.i18n.localize("PEN."+i.type),
                        'total': i.system.total,
                        'name' : i.name,
                        'roll' : result.dice,
                        'result': result.level}
            await i.update ({'system.winter': Number(i.system.winter) + Number(result.level),
                             'system.XP': false })
          success.push(newRes);
        }
        if (i.type === 'trait' && i.system.oppXP){
          let result = await PENWinter.xpRoll(i.system.oppvalue)
          let newRes = {'type' : game.i18n.localize("PEN."+i.type),
                        'total': i.system.oppvalue,
                        'name' : i.system.oppName,
                        'roll' : result.dice,
                        'result': Number(result.level)}
            await i.update ({'system.winter': Number(i.system.winter) - Number(result.level),
                            'system.oppXP': false})
          success.push(newRes);
        }
      }
    }
    //If no stats were checked for improvement then no chat message needed
    if (success.length < 1) {
      await this.actor.update({'system.status.xp': false})
      ui.notifications.warn(game.i18n.localize('PEN.noImprovements'))
      return
    }
    const html = await PENWinter.xpChatCard(success, this.actor.name);
    let msg = await PENWinter.showXPChat (html,this.actor)
    await this.actor.update({'system.status.xp': false})
  }

  //
  //XP Check Dice Roll - roll exceeds score or roll = 20
  //
  static async xpRoll(target) {
    let resultLevel = 0
    let roll = new Roll('1D20');
    await roll.evaluate();
    if (Number(roll.total) > target || Number(roll.total) === 20) {
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
        //type: CONST.CHAT_MESSAGE_TYPES.ROLL,
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
      return
    }
    if (route != 'prestige' && !this.actor.system.status.train) {
      return
    }
    let options = [];
    for (let [key, stat] of Object.entries(this.actor.system.stats)) {
      //For prestige choice add all characteristics, for single training add all except for Size and only if value <20
      if (route === 'prestige' || (route === 'single' && key != 'siz' && stat.total<20 && this.actor.system.age<35) || (route === 'single' && key === 'siz' && stat.total<20 && stat.growth<3 && this.actor.system.age<35) ) {
        let option = {
          'type': 'stat',
          'label': game.i18n.localize("PEN.characteristic"),
          'itemID': key,
          'name' : stat.label + " (" + stat.total + ")",
          'value': stat.total,
          'choice': 0,
          'max': stat.max,
          'min': stat.total
        }
      if (route === 'prestige') {option.max = 999}
      options.push(option);
      }
    }

    for (let i of this.actor.items) {
      if (i.type === 'skill') {
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

          //If a skill and prestige award no maximum. If multiple then max = 15.  Otherwise single training and max is the default of 20
          //Can't decrease skills so the minimum is skill value
          if (i.type === 'skill') {
            option.min = i.system.value;
            if (route === 'prestige') {
              option.max = 999;
            } else if (route === 'multiple') {
              option.max = 15;
            }
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

    //If prestige or single training point then amount = 1, otherwise can choose 6 points
    let amount = 1;
    if (route === 'multiple') {amount = 6};
    let title = game.i18n.localize('PEN.prestigeAward');
    if (route != 'prestige') {title = game.i18n.localize('PEN.training')}

    const selected = await WinterSelectDialog.create (title, options, this.actor.name, amount);
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
          let target = 'system.stats.' + picked.itemID + '.winter';
          pickedName = pickedName + this.actor.system.stats[picked.itemID].label +"(1)";
          await this.actor.update({[target] : this.actor.system.stats[picked.itemID].winter + 1});
          if (picked.itemID === 'siz' && route !='prestige') {
            let conLoss = Math.max(this.actor.system.stats.siz.growth -1,0)
            await this.actor.update({'system.stats.siz.growth' : this.actor.system.stats.siz.growth + 1,
                                     'system.stats.dex.winter' : this.actor.system.stats.dex.winter - 1,
                                     'system.stats.con.winter' : this.actor.system.stats.con.winter - conLoss,
                                     });
          }


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
        let newHist = await Item.create(itemData, {parent: this.actor});
        let key = await game.system.api.pid.guessId(newHist)
        await newHist.update({'flags.Pendragon.pidFlag.id': key,
                             'flags.Pendragon.pidFlag.lang': game.i18n.lang,
                             'flags.Pendragon.pidFlag.priority': 0})

  }

  static async winterImprovePassion(route, event) {

    if (route === 'prestige' && this.actor.system.gloryPrestige < 1) {
      return
    }
    if (route != 'prestige' && !this.actor.system.status.train) {
      return
    }
    let options = [];
    for (let i of this.actor.items) {
      if (i.type === "passion") {
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

        // For passions range is 1-20 except for Prestige reward when there is no max or min
        if (route === 'prestige'){
          option.max = 999;
          option.min = -999;
        }

        options.push(option);
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

    let amount = 1;
    let title = game.i18n.localize('PEN.prestigeAward');
    if (route != 'prestige') {title = game.i18n.localize('PEN.training')}

    const selected = await WinterSelectDialog.create (title, options, this.actor.name, amount);
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

        let item = this.actor.items.get(picked.itemID);
        pickedName = pickedName + item.name +"(" + picked.choice + ")";
        await item.update({'system.value': Number(item.system.value) + Number(picked.choice)});
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
        let newHist = await Item.create(itemData, {parent: this.actor});
        let key = await game.system.api.pid.guessId(newHist)
        await newHist.update({'flags.Pendragon.pidFlag.id': key,
                             'flags.Pendragon.pidFlag.lang': game.i18n.lang,
                             'flags.Pendragon.pidFlag.priority': 0})

  }


  // Training may bring a trait up to 19
  // A prestige reward can bring a trait to 20 or above
  static async winterImproveTrait(route, event) {

    // shouldn't have been able to select prestige
    if (route === 'prestige' && this.actor.system.gloryPrestige < 1) {
      return
    }

    // training should be done first
    if (route != 'prestige' && !this.actor.system.status.train) {
      return
    }
    const minVal = route != "prestige" ? 1 : -999;
    const maxVal = route != "prestige" ? 19 : 999;
    const traits = await (this.actor.items.filter(itm =>itm.type==='trait')).map(itm=>{return {
      id: itm.id, name: itm.name, value: itm.system.total, origVal:itm.system.total,
      religious: itm.system.religious,
      oppName: itm.system.oppName,
      oppValue: itm.system.oppvalue,
      minVal: minVal, maxVal: maxVal, winter:itm.system.winter
    }})
    traits.sort(function(a, b){
      let x = a.name;
      let y = b.name;
      if (x < y) {return -1};
      if (x > y) {return 1};
    return 0;
    });
    let traitVal = await TraitsSelectDialog.create(traits,1,false,game.i18n.localize('PEN.Entities.Trait'))
    if (!traitVal) {
      ui.notifications.warn(game.i18n.localize('PEN.noSelection'));
      return false;
    }
    // increase the value
    const picks = []
    const changes = await traitVal.filter(itm=>itm.value != itm.origVal).map(itm=>{
      picks.push(`${itm.name}(${Number(itm.value)-Number(itm.origVal)})`);
      return {_id: itm.id, 'system.winter': Number(itm.winter) + Number(itm.value)-Number(itm.origVal)};
    });
    await Item.updateDocuments(changes, {parent: this.actor});
    let pickedName = picks.join(", ");

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
    let newHist = await Item.create(itemData, {parent: this.actor});
    let key = await game.system.api.pid.guessId(newHist)
    await newHist.update({'flags.Pendragon.pidFlag.id': key,
                          'flags.Pendragon.pidFlag.lang': game.i18n.lang,
                          'flags.Pendragon.pidFlag.priority': 0})
  }

  //Economic Circumstances
  //
  static async economic(event) {
    if (!this.actor.system.status.economic) {return}
    let standardList = PENSelectLists.getSOLType()

    let messageData = {
      solType: standardList,
      selectType: this.actor.system.sol
    }
    let html = await renderTemplate ('systems/Pendragon/templates/dialog/economicOptions.html', messageData);
    let usage = await new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: game.i18n.localize("PEN.chooseSOL"),
        content: html,
        buttons: {
          button1: {
            label: game.i18n.localize("PEN.confirm"),
            callback: html => {
              formData = new FormData(html[0].querySelector('#economic-form'))
              return resolve(formData)
              }
          },
        },
        default: 'button1',
        close: () => {}
      },{classes: ["Pendragon", "sheet"]})
      dlg.render(true);
    })

    let newSOL = usage.get('decisionChoice')
    if (['poor','impoverished'].includes(newSOL)) {
      let confirmation = await PENUtilities.confirmation(game.i18n.localize('PEN.economicConfirm'))
      if (!confirmation) {return}
    }

    let impoverished = this.actor.system.impoverished
    let conPoor = this.actor.system.stats.con.sol
    let conImp = this.actor.system.stats.con.major
    //If the last year was Ordinary SOL or better then impoverished reset to 0
    if (['ordinary','rich','superlative'].includes(this.actor.system.sol)) {
      impoverished = 0
      conPoor = 0
    }

    //Make Adjustments for the selection
    let armour =[]
    let horses = []
    let companions = []
    let conRoll = 0
    let clothing = ""
    switch (newSOL) {
      case "ordinary":
      case'rich':
      case 'superlative':
        break

      case "poor":
        //Make CON roll
        conRoll = await PENWinter.statRoll(this.actor,'con')
        if (conRoll<2) {
          conPoor = -1
        }
        //Degrade armour by 1 point if not already degraded
        armour = await this.actor.items.filter(aitm=>aitm.type==='armour').filter(itm=>itm.system.type && !itm.system.poor).map(itm=>{return {_id:itm.id, 'system.ap': Math.max(Number(itm.system.ap-1),0), 'system.poor': true}})
        await Item.updateDocuments(armour, {parent: this.actor})
        //Degrade horses if not already degraded
        horses = await this.actor.items.filter(aitm=>aitm.type==='horse').filter(itm=> !itm.system.poor).map(itm=>{return {
          _id:itm.id,
          'system.move': Math.max(Number(itm.system.move-10),0),
          'system.con': Math.max(Number(itm.system.con-3),0),
          'system.chargeDmg': Math.max((Number((itm.system.chargeDmg).toUpperCase().split("D")[0])-1),0)+"D6",
          'system.maxHP': Number(itm.system.maxHP-3),
          'system.hp': Math.min(itm.system.hp,Number(itm.system.maxHP-3)),
          'system.poor': true
        }})
        await Item.updateDocuments(horses, {parent: this.actor})
        //If no "poor or impoverished years then set to -1"
        if (impoverished === 0) {impoverished = -1}
      //Reduce Clothing value
        clothing = await this.actor.items.filter(itm=>itm.type==='gear').filter(itm=>itm.flags.Pendragon.pidFlag.id === 'i.gear.clothing')[0]
        if (clothing) {
          await PENWinter.priceReduction(clothing)
        }
        break

      case "impoverished":
        //Make CON roll for permanent loss
        conRoll = await PENWinter.statRoll(this.actor,'con')
        if (conRoll<2) {
          conImp = conImp -1
        }
      //Degrade armour by 1 point
        armour = await this.actor.items.filter(aitm=>aitm.type==='armour').filter(itm=>itm.system.type).map(itm=>{return {_id:itm.id, 'system.ap': Math.max(Number(itm.system.ap-1),0),'system.poor': true}})
        await Item.updateDocuments(armour, {parent: this.actor})
        impoverished = impoverished -1
      //Delete all squires and horses
      companions = await this.actor.items.filter(itm=>itm.type==='horse'||(itm.type==='squire' && itm.system.category==='squire')).map(itm => {return (itm.id)})
      if (companions.length > 0) {
        let confirmation = await PENUtilities.confirmation(game.i18n.localize('PEN.deleteHorsesSquires'))
        if (confirmation) {
          await Item.deleteDocuments(companions, {parent: this.actor});
        } else {
          ui.notifications.warn(game.i18n.format('PEN.deleteManual',{group: game.i18n.localize('PEN.horsesSquires')}));
        }
      }
      //Reduce Honour by 2 point
        let honour = this.actor.items.filter(itm=>itm.type==='passion').filter(itm=>itm.flags.Pendragon.pidFlag.id=== 'i.passion.honour').map(itm=>{return {_id:itm.id,'system.sol': itm.system.sol-2}})
        await Item.updateDocuments(honour, {parent: this.actor})
      //Reduce Clothing value
        clothing = await this.actor.items.filter(itm=>itm.type==='gear').filter(itm=>itm.flags.Pendragon.pidFlag.id === 'i.gear.clothing')[0]
        if (clothing) {
          await PENWinter.priceReduction(clothing)
        }
        break
      default :
        ui.notifications.warn(game.i18n.localize('PEN.noSOL'));
        return

    }

    await this.actor.update({'system.stats.siz.sol': impoverished,
                             'system.stats.str.sol': impoverished,
                             'system.stats.app.sol': impoverished,
                             'system.stats.con.sol': conPoor,
                             'system.stats.con.major': conImp,
                             'system.sol': newSOL,
                             'system.impoverished': impoverished,
                             'system.status.economic': false
                            })

    return

  }

  //Simple Stats roll
  static async statRoll(actor,stat) {
    let msgID = await  PENCheck._trigger({
      rollType: 'CH',
      cardType: 'NO',
      characteristic: stat,
      shiftKey: true,
      actor: actor,
      token: ""
    })
    let level = await game.messages.get(msgID).flags.Pendragon.chatCard[0].resultLevel
    return (level)
  }

  //Reduce clothing value
  static async priceReduction (clothing) {
    let libra=0
    let denarii = 0
    let price = Math.floor(((Number(clothing.system.libra)*240)+Number(clothing.system.denarii))/2)
    if (price >= 60) {
      libra = Math.floor(libra/240)
      denarii = price - (libra*240)
    }
    await clothing.update({'system.libra': libra,
                           'system.denarii': denarii})
    return
  }

  //Aging
  static async aging(event) {
    if (!this.actor.system.status.aging) {return}
    //Age is increased at end of winter phase so current age check is 34 or more gor agin
    if (this.actor.system.age<34) {
      await this.actor.update ({'system.status.aging': false})
      return
    }

    let senRes = {
      1: {label: game.i18n.localize('PENDRAGON.StatSizAbbr'),value: 0,base:this.actor.system.stats.siz.total},
      2: {label: game.i18n.localize('PENDRAGON.StatDexAbbr'),value: 0,base:this.actor.system.stats.dex.total},
      3: {label: game.i18n.localize('PENDRAGON.StatStrAbbr'),value: 0,base:this.actor.system.stats.str.total},
      4: {label: game.i18n.localize('PENDRAGON.StatConAbbr'),value: 0,base:this.actor.system.stats.con.total},
      5: {label: game.i18n.localize('PENDRAGON.StatAppAbbr'),value: 0,base:this.actor.system.stats.app.total},
      6: {label: game.i18n.localize('PEN.none'),value: 0, base:0}
    }
    let results = []
    let result = await PENUtilities.simpleDiceRoll('2D6')
    let senes = Math.max(Math.abs(Number(result)-7)-1,0)
    if (senes > 0) {
      for (let sCount =1; sCount<=senes; sCount++) {
        let senResult = await PENUtilities.simpleDiceRoll('1D6')
        switch (senResult) {
        case 1:
        case 2:
        case 3:
        case 5:
          if (senRes[senResult].base > 5) {
            senRes[senResult].value ++
            senRes[senResult].base --
            results.push({label: senRes[senResult].label,
              number: senResult})
          } else {
            senRes[4].value ++
            results.push({label: senRes[4].label,
              number: senResult})
          }
          break
        case 4:
        case 6:
          senRes[senResult].value ++
          results.push({label: senRes[senResult].label,
            number: senResult})
          break
        }
      }
    }

    //Make decrepitude roll
    let decRes = 0
    let decLabel = game.i18n.localize('PEN.decrepitudeLive')
    if(this.actor.system.stats.con.total-senRes[4].value <6) {
      decRes = await PENUtilities.simpleDiceRoll('1D6')
      if (decRes > this.actor.system.stats.con.total-senRes[4].value) {
        decLabel = game.i18n.localize('PEN.decrepitudeDeath')
      }
    }
    let html = await PENWinter.agingRollChatCard (result,senes,results, this.actor.name, decRes,decLabel)
    await PENWinter.showAgingRollChat (html, this.actor)
    await this.actor.update ({
      'system.stats.siz.age': this.actor.system.stats.siz.age - senRes[1].value,
      'system.stats.dex.age': this.actor.system.stats.dex.age - senRes[2].value,
      'system.stats.str.age': this.actor.system.stats.str.age - senRes[3].value,
      'system.stats.con.age': this.actor.system.stats.con.age - senRes[4].value,
      'system.stats.app.age': this.actor.system.stats.app.age - senRes[5].value,
      'system.status.aging': false})
  }


  //Aging Roll Chat Card
  static async agingRollChatCard (mainRoll, senes, results, actorName, decRes, decLabel) {
    let mainLabel = game.i18n.format('PEN.senesence',{senes: senes})
    if (senes === 0) {
      mainLabel = game.i18n.localize('PEN.noAging')
    }
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actorName }),
      results: results,
      mainRoll: mainRoll,
      mainLabel:mainLabel,
      decRes: decRes,
      decLabel: decLabel
    }
    const messageTemplate = 'systems/Pendragon/templates/chat/aging.html'
    let html = await renderTemplate (messageTemplate, messageData);
    return html;
  }

  // Display the aging roll chat card
  static async showAgingRollChat(html, actor) {
    let chatData={};
      chatData = {
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER,
        content: html,
        speaker: {
          actor: actor._id,
          alias: actor.name,
        },
      }
    let msg = await ChatMessage.create(chatData);
    return
  }

  //Annual Squire roll
  //
  static async squireWinter(event){
    if (!this.actor.system.status.squireAge) {return}
    let squires = await this.actor.items.filter(itm=>itm.type==='squire')
    let leavers =[]
    //Check each retainer (squire, maiden, other) for leaving
    for (const sqr of squires) {
      if ((sqr.system.category === 'squire' && sqr.system.age>20)||(sqr.system.category === 'maiden' && sqr.system.age>16)||(sqr.system.category === 'other')) {
        let result = await PENUtilities.simpleDiceRoll('1D20')
        sqr.system.leave = false
        sqr.system.label = game.i18n.localize('PEN.remains')
        sqr.system.result = result
        switch (sqr.system.category) {
          case "squire":
            if (sqr.system.result <= 5 + sqr.system.age-19) {
              sqr.system.leave = true
              sqr.system.label = game.i18n.localize('PEN.leaves')
            }
            break
          case "maiden" :
            sqr.system.result = sqr.system.result + ((sqr.system.age-16)*2) + Math.max((sqr.system.age-20)*3,0)
            if (sqr.system.result >=20) {
              sqr.system.leave = true
              sqr.system.label = game.i18n.localize('PEN.marries')
            }
          case "other":
            if (sqr.system.result <= 3) {
              sqr.system.leave = true
              if (sqr.system.result === 1) {
                sqr.system.label = game.i18n.localize('PEN.died')
              } else {
                sqr.system.label = game.i18n.localize('PEN.leaves')
              }
            }
            break
        }
        leavers.push({id:sqr._id, name: sqr.name, result:sqr.system.result, leave:sqr.system.leave, label: sqr.system.label})
      }
    }
    //If there are retainer that needed testing them create the chat message and delete leavers
    if (leavers.length > 0) {
      let html = await PENWinter.houseLeaveChatCard (leavers, this.actor.name)
      await PENWinter.showAgingRollChat (html, this.actor)
      let remove = await leavers.filter(itm=>itm.leave).map(itm => {return (itm.id)})
      //If there are retainers to be removed then check you want this done automatically
      if (remove.length > 0) {
        let confirmation = await PENUtilities.confirmation(game.i18n.localize('PEN.deleteRetainers'))
        if (confirmation) {
          await Item.deleteDocuments(remove, {parent: this.actor});
        } else {
          ui.notifications.warn(game.i18n.format('PEN.deleteManual',{group: game.i18n.localize('PEN.retainers')}));
        }
      }
    }

    //Check remaining squires (not maidens or others) for Squire skill improvement
    squires = await this.actor.items.filter(itm=>itm.type==='squire' && itm.system.category==='squire')
    let sqrUpdate = []
    for (const sqr of squires) {
      let imp = 0
      let result = 20
      if (sqr.system.skill <15) {
        imp = 1
      } else {
        let result = await PENUtilities.simpleDiceRoll('1D20')
        if (sqr.system.skill === 20 && result === 20) {
          imp = 1
        } else if (sqr.system.skill<20 && result >16) {
          imp = 1
        }
      }
      sqrUpdate.push({_id: sqr._id, name: sqr.name, result: result, skill : sqr.system.skill+imp, improve: imp})
    }
    if (sqrUpdate.length > 0) {
      let html = await PENWinter.squireImprove (sqrUpdate, this.actor.name)
      await PENWinter.showAgingRollChat (html, this.actor)
      let change = await sqrUpdate.map(itm => {return ({_id: itm._id,'system.skill': itm.skill})})
      await Item.updateDocuments(change, {parent: this.actor})
    }
    await this.actor.update ({'system.status.squireAge': false})
  }


  //Household Departure Roll Chat Card
  static async houseLeaveChatCard (leavers, actorName) {
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actorName }),
      leavers: leavers,
    }
    const messageTemplate = 'systems/Pendragon/templates/chat/houseLeave.html'
    let html = await renderTemplate (messageTemplate, messageData);
    return html;
  }

  //Squire Improvement Chat Card
  static async squireImprove (squires,actorName) {
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actorName }),
      squires: squires,
    }
    const messageTemplate = 'systems/Pendragon/templates/chat/squireImprove.html'
    let html = await renderTemplate (messageTemplate, messageData);
    return html;
  }

  //Horse Survival Rolls
  static async horseSurvival(event) {
    if (!this.actor.system.status.horseSurv) {return}
    //Get all combat and special horses
    let horses = this.actor.items.filter(itm=>itm.type==='horse').filter(itm=>(itm.system.combat||itm.system.special))
    let dead=[]
    let updHorse=[]
    let change=[]
    if (horses.length > 0) {
      for (const horse of horses) {
        let adj = -Number(horse.system.horseCare)-Number(horse.system.horseHealth)
        if (this.actor.system.sol === 'poor') {adj = adj-1}
        if (this.actor.system.sol === 'impoverished') {adj = adj+ this.actor.system.impoverished}
        //Roll 1D20 for the horse
        let result = await PENUtilities.simpleDiceRoll('1D20')
        //If results is <=1 Horse Dies
        if (result+adj<=1) {
          change.push({_id: horse._id, name: horse.name, result: result, adj : adj, survive: false, currHealth: horse.system.horseHealth, health: 0, label: game.i18n.localize('PEN.died')})
          dead.push(horse._id)
        //If result =3+ horse surivives
        } else if (result+adj>2) {
          change.push({_id: horse._id, name: horse.name, result: result, adj : adj, survive: true, currHealth: horse.system.horseHealth, health: 0, label: game.i18n.localize('PEN.survived')})
          updHorse.push({_id:horse._id, 'system.horseCare':0, 'system.horseHealth': horse.system.horseHealth})
        //Otherwise make a horsemanship roll
        } else {
          let level = await PENWinter.horsemanshipRoll(this.actor)
          //Horsemanship result determines outcome
          if (level ===3) {
            change.push({_id: horse._id, name: horse.name, result: result, adj : adj, survive: true, currHealth: horse.system.horseHealth, health: 0, label: game.i18n.localize('PEN.survived')})
            updHorse.push({_id:horse._id, 'system.horseCare':0, 'system.horseHealth': horse.system.horseHealth})
          } else if (level ===2) {
            change.push({_id: horse._id, name: horse.name, result: result, adj : adj, survive: true, currHealth: horse.system.horseHealth, health: 1, label: game.i18n.localize('PEN.weak')})
            let chng = await PENWinter.horseUpdate(horse, horse.system.horseHealth, 1)
            updHorse.push({_id:horse._id, 'system.horseCare':0, 'system.horseHealth': Math.max(horse.system.horseHealth,1), 'system.move': chng.move, 'system.maxHP': chng.maxHP, 'system.hp': chng.currHP, 'system.chargeDmg': chng.chargeDmg})
          } else if (level ===1) {
            change.push({_id: horse._id, name: horse.name, result: result, adj : adj, survive: true, currHealth: horse.system.horseHealth, health: 2, label: game.i18n.localize('PEN.vweak')})
            let chng = await PENWinter.horseUpdate(horse, horse.system.horseHealth, 2)
            updHorse.push({_id:horse._id, 'system.horseCare':0, 'system.horseHealth': Math.max(horse.system.horseHealth,2), 'system.move': chng.move, 'system.maxHP': chng.maxHP, 'system.hp': chng.currHP, 'system.chargeDmg': chng.chargeDmg})
          } else if (level ===0) {
            change.push({_id: horse._id, name: horse.name, result: result, adj : adj, survive: false, currHealth: horse.system.horseHealth, health: 0, label: game.i18n.localize('PEN.died')})
            dead.push(horse._id)
          }
        }


      }
      //If there were horses to test then produce a chat card
      if (change.length > 0) {
        let html = await PENWinter.houseSurvivalChatCard (change, this.actor.name)
        await PENWinter.showAgingRollChat (html, this.actor)

        //If horses dies then confirm deletion
        if (dead.length > 0) {
          let confirmation = await PENUtilities.confirmation(game.i18n.localize('PEN.deleteHorses'))
          if (confirmation) {
            await Item.deleteDocuments(dead, {parent: this.actor});
          } else {
            ui.notifications.warn(game.i18n.format('PEN.deleteManual',{group: game.i18n.localize('PEN.horses')}));
          }
        }
        await Item.updateDocuments(updHorse, {parent: this.actor})
      }
    }
    await this.actor.update ({'system.status.horseSurv': false})
  }

  //Horse Health Update
  static async horseUpdate(horse,currHealth, newHealth){
    let move = horse.system.move
    let maxHP = horse.system.maxHP
    let currHP = horse.system.hp
    let chargeDmg = horse.system.chargeDmg
    let change = newHealth - currHealth

    if (change > 0) {
      move = move - (change*2)
      let form = change+"D6"
      let result = await PENUtilities.simpleDiceRoll(form)
      maxHP = maxHP - result
      currHP = currHP - result
      if (newHealth === 2) {
        chargeDmg =  Math.max((Number((chargeDmg).toUpperCase().split("D")[0])-1),0)+"D6"
      }
    }
    return {
      move,
      maxHP,
      currHP,
      chargeDmg
    }
  }

  //Horsemanship roll
  static async horsemanshipRoll(actor) {
    let skillId = await actor.items.filter(itm=>itm.type==='skill').filter(itm=>itm.flags.Pendragon.pidFlag.id==='i.skill.horsemanship').map(itm => {return (itm.id)})[0]
    if(!skillId) {return 1}
    let msgID = await  PENCheck._trigger({
      rollType: 'SK',
      cardType: 'NO',
      skillId,
      shiftKey: true,
      actor: actor,
      token: ""
    })
    let level = await game.messages.get(msgID).flags.Pendragon.chatCard[0].resultLevel
    return (level)
  }

  //Characteristic Roll
  static async statRoll(actor,stat) {
    if (game.settings.get('Pendragon','switchShift')) {
      event.shiftKey = !event.shiftKey
    }
    let msgID = await PENCheck._trigger({
        rollType: 'CH',
        cardType: 'NO',
        characteristic: stat,
        shiftKey: true,
        actor: actor,
        token: ""
    })
    let level = await game.messages.get(msgID).flags.Pendragon.chatCard[0].resultLevel
    return (level)
  }

  //Horse Survival Chat Card
  static async houseSurvivalChatCard (horses, actorName) {
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actorName }),
      horses: horses,
    }
    const messageTemplate = 'systems/Pendragon/templates/chat/horseSurvival.html'
    let html = await renderTemplate (messageTemplate, messageData);
    return html;
  }

  //Family Rolls
  static async familyRoll(event){
    if (!this.actor.system.status.familyRoll) {return}
    //Child Survival Roll
    let children = this.actor.items.filter(itm=>itm.type==='family').filter(itm=>Number(itm.system.died) <1 && itm.system.relation==='child' && (game.settings.get('Pendragon','gameYear') - itm.system.born)<5 && !itm.system.blessed)
    if (children.length > 0) {
      let cldChng=[]
      for (const child of children) {
        let result = await PENUtilities.simpleDiceRoll('1D20')
        let adjRes = result + this.actor.system.impoverished
        if (this.actor.system.sol === 'poor') {
          adjRes = adjRes-1
        }
        let died = ""
        let label = game.i18n.localize('PEN.survived')

        if (game.settings.get('Pendragon','gameYear')-child.system.born === 1){
          if (adjRes < 5) {
            died = game.settings.get('Pendragon','gameYear')
            label = game.i18n.localize('PEN.died')
          }
        }  else {
          if (adjRes <2) {
            died = game.settings.get('Pendragon','gameYear')
            label = game.i18n.localize('PEN.died')
          }
        }
        cldChng.push({_id:child._id, name: child.name,result: result, adj: adjRes-result, died: died, label:label})
      }
      let html = await PENWinter.childSurvivalChatCard (cldChng, this.actor.name)
      await PENWinter.showAgingRollChat (html, this.actor)
      let cldUpd = cldChng.map(itm=> {return {_id:itm._id,'system.died': itm.died}})
      await Item.updateDocuments(cldUpd, {parent: this.actor})
    }

    //Childbirth
    //Produce list of options and get the option
    let list = [
      {name: game.i18n.localize('PEN.self'), pid: 'self'},
      {name: game.i18n.localize('PEN.other'), pid: 'other'}
    ]
    let spouse = await (this.actor.items.filter(itm=>itm.type==='family').filter(itm=>itm.system.relation==='spouse')).length
    if (spouse>0) {
      list.unshift({name: game.i18n.localize('PEN.spouse'), pid: 'spouse'})
    }
    let decision =  await PENCharCreate.selectFromRadio('list',true,list,game.i18n.localize('PEN.childBirth'))
    let prestige = "none"
    //Unless 'none' has been chosen
    if (decision !='none'){

      //If prestige points are available ask if you want to spend one
      if (this.actor.system.gloryPrestige>0) {
        let prestList = [
          {name: game.i18n.localize('PEN.conception'), pid: 'conception'},
          {name: game.i18n.localize('PEN.health'), pid: 'health'},
          {name: game.i18n.localize('PEN.gender'), pid: 'gender'},
        ]
        let heir = await (this.actor.items.filter(itm=>itm.type==='family').filter(itm=>itm.system.relation==='child'&&Number(itm.system.died)<1)).length
        if (heir<1) {
          prestList.unshift({name: game.i18n.localize('PEN.heir'), pid: 'heir'})
        }
        prestige = await PENCharCreate.selectFromRadio('list',true,prestList,game.i18n.localize('PEN.spendPrestige'))
      }
      //Now selected person giving birth (decision) and it prestige spent
      let con = 13
      let prevBirth = 0
      let ageAdj = 0
      let solAdj = 0
      let impAdj = 0
      let birthRes = 0
      let newborn = []
      let result = 0
      let firstConcept = 0
      let diceRoll=""
      let childDies = false
      let motherDies = false
      let motherBarren = false
      let noChild = false
      let conLoss=0
      let strLoss=0
      let sizLoss=0
      let tragedyRes = 0
      let tragedyGen = 0
      let midResult = 0
      let critRes = 0
      let multiRes = 0
      let trip = 0
      //Else if a PC making the roll
      if (decision==='self'){
        con = this.actor.system.stats.con.total
        impAdj = this.actor.system.impoverished
        if (this.actor.system.sol==='poor') {solAdj=-1}
      }
      //Get dialog box for relevant inputs
      let usage = await PENWinter.conceptionDialog (decision)
      if (usage) {
        if (decision !='self') {
          con = Number(usage.get('conStat'))
          impAdj = -usage.get('impoverishedYears')
          if (usage.get('sol')==='poor') {solAdj=-1}
          ageAdj =Math.min(35 - usage.get('age'),0)
        }
        if (usage.get('childLastYear')==='yes') {prevBirth=-10}
        if (usage.get('firstConception')==='yes') {firstConcept=1}
      } else {return}
      let target = con+impAdj+solAdj+ageAdj+prevBirth

      //If no chance of conception or if barren/barren marriage
      let barren = false
      if (decision === 'spouse' && (await (this.actor.items.filter(itm=>itm.type==='family').filter(itm=>itm.system.relation==='spouse')))[0].system.barrenMarriage) {
        barren = true
      } else if (decision === 'self') {
        barren = this.actor.system.status.barren
      }
      if ((target<=0 || barren) && !['heir','conception'].includes(prestige)) {
        birthRes = -1
      } else{
        //Otherwise make a roll but if prestige spent then minimum level of 2 (success)
        result = await PENUtilities.simpleDiceRoll('1D20')
        if (result === target) {
          birthRes = 3
        } else if (result <= target || ['heir','conception'].includes(prestige)) {
          birthRes = 2
        } else if (result === 20) {
          birthRes = 0
        } else {
          birthRes = 1
        }
      }

      let birthLabel = ""
      let gender = ""
      //Resolve the outcome of the Birth Result
      switch(birthRes) {
        case -1: //Auto Fail - chance <= 0
          birthLabel = game.i18n.localize('PEN.noConceptionChance')
          break
        case 0:  //Tragedy
          birthLabel = game.i18n.localize('PEN.tragedyStrikes')
          tragedyRes = await PENUtilities.simpleDiceRoll('1D6') + firstConcept
          if (['heir','gender'].includes(prestige)) {
            gender = await PENWinter.chooseGender()
          } else {
            tragedyGen = await PENUtilities.simpleDiceRoll('1D6')
            if ((tragedyGen % 2) == 0) {
              gender = 'female'
            } else {
              gender = 'male'
            }
          }
          //Outcome of tragedy Roll
          if (tragedyRes <3) {
            motherDies = true
            childDies = true
          } else if (tragedyRes<5) {
            motherDies = true
          } else if (tragedyRes <6) {
            motherBarren = true
          } else if (tragedyRes <7) {
            motherBarren = true
            childDies = true
          } else {
            motherBarren = true
            noChild = true
          }
          //If Prestige spent on health then child doesnt die
          if (prestige==='health') {
            childDies=false
            noChild=false
          }
          //If there is a death then check for a Midwife roll
          if (childDies || motherDies){
            //Get midwife score
            let midwifScore = await PENCharCreate.inpValue(game.i18n.localize('PEN.midwifeScore'))
            if (midwifScore >0) {
              //If score entered then make check roll
              midResult = await PENUtilities.simpleDiceRoll('1D20')
              if (midResult <= midwifScore) {
                //If succesful and both child & mother dies then select one to save
                if (childDies && motherDies) {
                  let midwifeList = [
                    {name: game.i18n.localize('PEN.child'), pid: 'child'},
                    {name: game.i18n.localize('PEN.mother'), pid: 'mother'}
                  ]
                  let midDecision =  await PENCharCreate.selectFromRadio('list',false,midwifeList,game.i18n.localize('PEN.midwifeSave'))
                  if (midDecision === 'child') {
                    childDies = false
                  } else {
                    motherDies = false
                  }
                } else {
                  //Otherwise they'll they both survive
                  childDies = false
                  motherDies = false
                }
              }
            }
          }
          //If Mother Dies and is a PC
          if (motherDies && decision === 'self') {
            let conCheck = await PENWinter.statRoll(this.actor,'con')
            if (conCheck >1) {
              conLoss = 1
              motherDies = false
            } else {
              conLoss = 2
              let strCheck = await PENWinter.statRoll(this.actor,'str')
              if (strCheck > 1){
                strLoss = 1
                motherDies = false
              } else {
                strLoss = 2
                let sizCheck = await PENWinter.statRoll(this.actor,'siz')
                if (sizCheck > 1){
                  sizLoss = 1
                  motherDies = false
                }
              }
            }
          }
          //Add any children to the newborn list
          if (!childDies && !noChild){
            newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:"", blessed:false})
          } else if (childDies && !noChild) {
            newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"dies",notes:game.i18n.localize('PEN.died'), blessed:false})
          }
          break
        case 1: //Fail - no birth
          birthLabel = game.i18n.localize('PEN.noConception')
          break
        case 2: //Success - single birth
        if (['heir','gender'].includes(prestige)) {
          gender = await PENWinter.chooseGender()
        } else {
          if ((result % 2) == 0) {
            gender = 'female'
          } else {
            gender = 'male'
          }
        }
        newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:"", blessed:false})
        birthLabel = game.i18n.localize('PEN.conceived')
          break
        case 3: //Multiple Birth - Critical Success
          if (['heir','gender'].includes(prestige)) {
            gender = await PENWinter.chooseGender()
          }
          critRes = await PENUtilities.simpleDiceRoll('1D6')
          if (critRes <5) {
            multiRes = await PENUtilities.simpleDiceRoll('1D20')
            if (multiRes <8) {
              birthLabel = game.i18n.localize('PEN.twins')
              newborn.push({name:game.i18n.localize('PEN.child'),gender:'male', genderLabel: game.i18n.localize('PEN.male'), status:"lives",notes:birthLabel, blessed:false})
              newborn.push({name:game.i18n.localize('PEN.child'),gender:'female', genderLabel: game.i18n.localize('PEN.female'), status:"lives",notes:birthLabel, blessed:false})
            } else if (multiRes<11) {
              birthLabel = game.i18n.localize('PEN.twins')
              if (gender === "") { gender = 'female'}
              newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:birthLabel, blessed:false})
              newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:birthLabel, blessed:false})
            } else if (multiRes<14) {
              birthLabel = game.i18n.localize('PEN.twins')
              if (gender === "") { gender = 'male'}
              newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:birthLabel, blessed:false})
              newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:birthLabel, blessed:false})
            } else if (multiRes<17) {
              birthLabel = game.i18n.localize('PEN.twinsIdentical')
              if (gender === "") { gender = 'female'}
              newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:birthLabel, blessed:false})
              newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:birthLabel, blessed:false})
            } else if (multiRes<20) {
              birthLabel = game.i18n.localize('PEN.twinsIdentical')
              if (gender === "") { gender = 'male'}
              newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:birthLabel, blessed:false})
              newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:birthLabel, blessed:false})
            } else {
              let triplets=[]
              let identical = true
              let identRoll = 0
              for (let tCount=0; tCount<3; tCount++) {
                trip = await PENUtilities.simpleDiceRoll('1D6')
                if ((trip % 2) == 0) {
                  triplets.push({gender: 'female', trip})
                } else {
                  triplets.push({gender: 'male', trip})
                }
                //Check for identical triplets
                if (tCount === 0) {
                  identRoll = trip
                }  else {
                  if (identRoll != trip) {
                    identical = false
                  }
                }
              }
              //If gender has been selected
              if  (['heir','gender'].includes(prestige)){
                //For indetical triplets set all to be chosen gender
                if (identical) {
                  triplets[0].gender = gender
                  triplets[1].gender = gender
                  triplets[2].gender = gender
                } else if (triplets.filter(itm=>itm.gender === gender).length === 0){
                  //For non-identical set first one to matched gender if non currently match
                  triplets[0].gender = gender
                }
              }
              birthLabel = game.i18n.localize('PEN.triplets')
              if (identical) birthLabel = game.i18n.localize('PEN.tripletsIdentical')
              newborn.push({name:game.i18n.localize('PEN.child'),gender:triplets[0].gender, genderLabel: game.i18n.localize('PEN.'+triplets[0].gender), status:"lives",notes:birthLabel, blessed:false})
              newborn.push({name:game.i18n.localize('PEN.child'),gender:triplets[1].gender, genderLabel: game.i18n.localize('PEN.'+triplets[1].gender), status:"lives",notes:birthLabel, blessed:false})
              newborn.push({name:game.i18n.localize('PEN.child'),gender:triplets[2].gender, genderLabel: game.i18n.localize('PEN.'+triplets[2].gender), status:"lives",notes:birthLabel, blessed:false})
            }
          } else {
            //Roll on Blessed table
            let table= (await game.system.api.pid.fromPIDBest({pid:'rt..blessed-birth'}))[0]
            birthLabel = game.i18n.localize('PEN.blessedBirth')
            let notes=""
            if (!table) {
              ui.notifications.error(game.i18n.localize('PEN.addBBmanually'))
            } else {
              const blessedResult = await PENUtilities.tableDiceRoll(table)
              //const blessedResult = await table.roll();
              //if (game.modules.get('dice-so-nice')?.active) {
              //  game.dice3d.showForRoll(blessedResult.roll)
              //}
              notes = blessedResult.results[0].text
            }

            if (['heir','gender'].includes(prestige)) {
              gender = await PENWinter.chooseGender()
            } else {
              if (critRes===6) {
                gender = 'female'
              } else {
                gender = 'male'
              }
            }
            newborn.push({name:game.i18n.localize('PEN.child'),gender:gender, genderLabel: game.i18n.localize('PEN.'+gender), status:"lives",notes:notes, blessed:true})
          }
          break
        default:
          birthLabel = game.i18n.localize('PEN.noConception')
          break
      }

      //Send chat message
      let html =  await PENWinter.childbirthChatCard(birthRes,birthLabel,newborn,motherDies,motherBarren,result,tragedyRes,tragedyGen,midResult,critRes,multiRes,trip,conLoss,strLoss,sizLoss,this.actor.name, this.actor._id)
      await PENWinter.showAgingRollChat (html, this.actor)

      //Create family members for each newborn
      let newAdditions = []
      for (let newFamily of newborn){
        let died = ""
        if (newFamily.status === 'dies') {
          died = game.settings.get('Pendragon','gameYear')
        }
        const itemData = {
          name: newFamily.name,
          type: 'family',
          system: {
            relation: "child",
            gender: newFamily.genderLabel,
            born: game.settings.get('Pendragon','gameYear'),
            died: died,
            description: newFamily.notes,
            blessed: newFamily.blessed
          },
          flags: {
            Pendragon: {
              pidFlag: {
                id: 'i.family.newborn',
                lang: game.i18n.lang,
                priority: 0
              }
            }
          }
        }
        newAdditions.push(itemData)
      }
      await Item.createDocuments(newAdditions, {parent: this.actor})

      //If mother dies then make updates to either spouse or actor
      if (motherDies) {
        if (decision === 'spouse') {
          let spouse = await(this.actor.items.filter(itm=>itm.type==='family').filter(itm=>itm.system.relation==='spouse'))[0]
          await spouse.update({'system.died': game.settings.get('Pendragon','gameYear')})
        } else if (decision === 'self'){
          await this.actor.update ({'system.status.nearDeath': true})
          const itemData = {
            name: game.i18n.localize('PEN.died'),
            type: 'history',
            system: {
              year: game.settings.get('Pendragon','gameYear'),
              description: game.i18n.localize('PEN.died')
            },
            flags: {
              Pendragon: {
                pidFlag: {
                  id: 'i.history.died',
                  lang: game.i18n.lang,
                  priority: 0
                }
              }
            }
          }
          await Item.create(itemData, {parent: this.actor});

        }
      }
      //If mother Barren then make updates to either spouse or actor
      if (motherBarren) {
        if (decision === 'spouse') {
          let spouse = await(this.actor.items.filter(itm=>itm.type==='family').filter(itm=>itm.system.relation==='spouse'))[0]
          await spouse.update({'system.barrenMarriage': true})
        } else if (decision === 'self'){
          await this.actor.update ({'system.status.barren': true})
        }
      }

      //If there are stats losses for the actor on birth
      if (conLoss>0 || strLoss>0 ||sizLoss>0)
        await this.actor.update ({
          'system.stats.con.age': this.actor.system.stats.con.age - conLoss,
          'system.stats.str.age': this.actor.system.stats.str.age - strLoss,
          'system.stats.siz.age': this.actor.system.stats.siz.age - sizLoss
        })

      //If any prestige was spent
      if (prestige != 'none') {
        await this.actor.update({'system.prestige':this.actor.system.prestige+1})
        //Add a History Item to show the spend
        const type = 'history'
        const name = `${type.capitalize()}`;
        const itemData = {
          name: name,
          type: type,
          system: {
            "description": game.i18n.localize('PEN.spendPrestige')+": "+game.i18n.localize('PEN.childBirth'),
            "year": game.settings.get('Pendragon',"gameYear"),
            "glory": 0
          },
          flags: {
            Pendragon: {
              pidFlag: {
                id: 'i.history.prestige',
                lang: game.i18n.lang,
                priority: 0
              }
            }
          }
        }
        await Item.create(itemData, {parent: this.actor});
      }
    }

    await this.actor.update({'system.status.familyRoll':false})
  }

  //Childbirth Card
  static async childbirthChatCard(birthRes,birthLabel,newborn,motherDies,motherBarren,result,tragedyRes,tragedyGen,midResult,critRes,multiRes,trip,conLoss,strLoss,sizLoss,actorName,actorID) {
    let statLoss=false
    if((conLoss + strLoss + sizLoss) >0) {statLoss=true}
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actorName }),
      actorID,
      birthRes,
      birthLabel,
      newborn,
      motherDies,
      motherBarren,
      result,
      tragedyRes,
      tragedyGen,
      midResult,
      critRes,
      multiRes,
      trip,
      conLoss,
      strLoss,
      sizLoss,
      statLoss
    }
    const messageTemplate = 'systems/Pendragon/templates/chat/childBirth.html'
    let html = await renderTemplate (messageTemplate, messageData);
    return html;
  }



  //Child Survival Card
  static async childSurvivalChatCard(children, actorName) {
    let messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actorName }),
    children: children,
    }
    const messageTemplate = 'systems/Pendragon/templates/chat/childSurvival.html'
    let html = await renderTemplate (messageTemplate, messageData);
    return html;
  }

  //Conception Dialog Box
  static async conceptionDialog (decision) {
    let destination = 'systems/Pendragon/templates/dialog/conception.html';
    let solType = PENSelectLists.getSOLType()
    let winTitle = game.i18n.localize('PEN.conception')
    let data = {
      decision,
      solType
    }
    const html = await renderTemplate(destination,data);
    let usage = await new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: winTitle,
        content: html,
        buttons: {
          roll: {
            label: game.i18n.localize("PEN.confirm"),
            callback: html => {
            formData = new FormData(html[0].querySelector('#conception-input-form'))
            return resolve(formData)
            }
          }
        },
        default: 'roll',
        close: () => {}
        },{classes: ["Pendragon", "sheet"],width:500})
        dlg.render(true);
      })
    return usage
  }

  //Select Gender of baby
  static async chooseGender() {
    let aspect = [
      {name: game.i18n.localize('PEN.male'), pid: 'male'},
      {name: game.i18n.localize('PEN.female'), pid: 'female'}
    ]
    let gender = await PENCharCreate.selectFromRadio('list',false,aspect,game.i18n.localize('PEN.childGender'))
    return gender
  }

}