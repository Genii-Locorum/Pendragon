import { PENactorDetails } from "../apps/actorDetails.mjs";

export class PENChecks {

  //
  //Kick off the check/roll process from a Rollable event
  //
  static async _onRollable(event){
    const dataset = event.currentTarget.dataset
    let partic =await PENactorDetails._getParticipantId(this.token,this.actor); 
    let actor = await PENactorDetails._getParticipant(partic.particId, partic.particType);
    let itemId = "";
    let type = dataset.type
    let name = dataset.label
    if (type === "passion" || type === "skill" || type === 'trait' || type === 'opptrait') {
      itemId = event.currentTarget.dataset.itemid;
      let item = actor.items.get(itemId);
      if (type === 'opptrait') {
        name = item.system.oppName
      } else {
      name = item.name
      }
    }
    PENChecks.startCheck ({
        shiftKey: event.shiftKey,
        partic: partic,
        type: type,
        label: name,
        targetScore: dataset.target,
        itemId: itemId
    })
    return
  }  

  //
  // Start the Roll
  //
  static async startCheck (options = {}) {
    const config = await PENChecks.initiateConfig(options)
    if (config === false) {return}
    await PENChecks.runCheck (config)
    return
  } 

  //
  // Set Roll and Dialog options for the check
  //
  static async initiateConfig(options){
    let actor = await PENactorDetails._getParticipant(options.partic.particId, options.partic.particType);
    //let item = actor.items.get(options.itemId);
    const config = {
      origin: game.user.id,
      originGM: game.user.isGM,
      shiftKey: options.shiftKey,
      gmRoll: options.gmRoll,
      label: options.label,
      partic: options.partic,
      targetScore: options.targetScore ? options.targetScore : 0,
      type: options.type ? options.type : '',               
      rollFormula: options.formula ? options.formula : "1d20",
      critBonus: 0,
      checkBonus: 0,
      resultLevel: 0,
      chatTemplate: 'systems/Pendragon/templates/chat/roll-result.html',
      dialogTemplate: 'systems/Pendragon/templates/dialog/rollOptions.html',
      winTitle: game.i18n.localize("PEN.rollWindow")
    }
    return config;
  }

  //
  // Run Check Routines 
  //
  static async runCheck (config) {
    let actor = await PENactorDetails._getParticipant(config.partic.particId, config.partic.particType);
  
    //If Shift key has been held then accept the defaults above otherwise call a Dialog box for Difficulty, Modifier etc
    if (config.shiftKey){
    } else{
      let usage = await PENChecks.RollDialog(config);
        if (usage) {
            config.checkBonus = Number(usage.get('checkBonus'));
        }
      }

    //Adjust target Score for check Bonus and calculate critBonus where target score > 20
    config.targetScore = Number(config.targetScore) + Number(config.checkBonus);
    config.grossTarget = config.targetScore
    if (config.targetScore > 20) {
      config.critBonus = config.targetScore - 20;
      config.targetScore = 20;
    }




    await PENChecks.makeRoll(config) ;  

    //TO DO:  Can we automate XP checks?  Perhaps with a game setting the GM can say automatically grants on anything but a fail?
  
    return
  }

  //  
  //Function to call the Modifier Dialog box 
  //
  static async RollDialog (options) {
    const data = {
      type : options.type,
      label: options.label,
    }
    const html = await renderTemplate(options.dialogTemplate,data);
    return new Promise(resolve => {
      let formData = null
      const dlg = new Dialog({
        title: options.winTitle,
        content: html,
        buttons: {
          roll: {
            label: game.i18n.localize("PEN.rollDice"),
            callback: html => {
            formData = new FormData(html[0].querySelector('#check-roll-form'))
            return resolve(formData)
            }
          }
        },
      default: 'roll',
      close: () => {}
      })
      dlg.render(true);
    })
  }

  //
  //Call Dice Roll, calculate Result and store original results in rollVal
  //
  static async makeRoll(config) {
    let roll = new Roll(config.rollFormula);
    await roll.roll({ async: true});
    config.roll = roll;
    config.rollResult = Number(config.roll.result);
    //Add the critBonus to the dice roll  but cap the roll it at 20
    config.rollVal = Math.min(Number(config.rollResult) + Number(config.critBonus),20)
    

  //Get the level of Success
    config.resultLevel = await PENChecks.successLevel(config)

  //Create the ChatMessage and Roll Dice
    const html = await PENChecks.startChat(config);
    await PENChecks.showChat(html,config);
 
    return
  } 

  //
  // Calculate Success Level
  //
  static async successLevel (config){
       
    //Get the level of success
    let resultLevel = 0;
      if (config.rollVal === config.targetScore) {
        resultLevel = 3;  //3 = Critical
      } else if (config.rollVal <config.targetScore) {
        resultLevel = 2;  //2 = Success
      } else if (config.rollVal >= 20) {
        resultLevel = 0;  //0 = Fumble
      } else {
        resultLevel = 1;  //1 = Fail
      }
    return resultLevel
  }

  //
  // Prep the chat card
  //
  static async startChat(config) {
    let actor = await PENactorDetails._getParticipant(config.partic.particId,config.partic.particType)

    let messageData = {
      origin: config.origin,
      originGM: config.originGM,
      speaker: ChatMessage.getSpeaker({ actor: actor.name }),
      rollType: config.type,
      label: config.label,
      actorId: actor._id,
      checkBonus: config.checkBonus,
      partic: config.partic,
      resultLevel : config.resultLevel,
      resultLabel: game.i18n.localize('PEN.resultLevel.'+config.resultLevel),
      result: config.rollVal,
      targetScore: config.targetScore,
      grossTarget: config.grossTarget,
  }

  const messageTemplate = config.chatTemplate
  let html = await renderTemplate (messageTemplate, messageData);

  return html;
}  

//
// Display the chat card and roll the dice
//
static async showChat(html,config) {

  let actor = await PENactorDetails._getParticipant(config.partic.particId,config.partic.particType)
  let chatData={};
    chatData = {
      user: game.user.id,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      rolls: [config.roll],
      content: html,
      flags: {config: config},
      speaker: {
        actor: actor._id,
        alias: actor.name,
      },
    }
      
    let msg = await ChatMessage.create(chatData);
    return 
  }

} 