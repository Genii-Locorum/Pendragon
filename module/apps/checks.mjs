import { PENactorDetails } from "./actorDetails.mjs";

export class PENChecks {

  //
  //Kick off the check/roll process from a Rollable event
  //
  static async _onRollable(event){
    const dataset = event.currentTarget.dataset
    let partic =await PENactorDetails._getParticipantId(this.token,this.actor); 
    let actor = await PENactorDetails._getParticipant(partic.particId, partic.particType);
    let itemId = "";
    let type = dataset.type;
    let name = "";
    let targetScore = 0;
    let oppTargetScore = 0;
    let dmgFormula = "";
    let decision = "main";
    let oppname = "";
    let shiftKey = event.shiftKey;
    let reflex = false;


    //Set the necessary roll variables based on the type of roll
    if (type === "stat") {
      name = dataset.label
      targetScore = dataset.target;
    } else if (type === 'glory') {
      name = game.i18n.localize('PEN.glory')
      targetScore = Math.round(actor.system.glory/1000)
    } else if (type === 'squire' || type === 'squireAge'){
      itemId = event.currentTarget.dataset.itemid;
      let item = actor.items.get(itemId);
      if (type === 'squire') {
        name = item.name
        targetScore = item.system.skill
      } else {
        name = item.name + "-"+ game.i18n.localize('PEN.age')
        targetScore = item.system.age - 11
      }  
    } else if (type === "passion" || type === "skill" || type === 'trait' || type === 'decisionTrait' || type === 'opptrait' || type === 'weapon' ||type === 'damage' ||type === 'horseDamage' ||type ==='horseChargeDamage') {
      itemId = event.currentTarget.dataset.itemid;
      let item = actor.items.get(itemId);
      name = item.name
      targetScore = item.system.value;
      //If this is a decision roll work out if there is a fixed first option for Trait or if the player chooses the trait
      if (type === 'decisionTrait'){
        reflex = true;
        oppTargetScore = item.system.oppvalue;
        oppname = item.system.oppName;  
        if (item.system.oppvalue > 15) {
          decision = "opp";
        } else if (item.system.value < 16) {
          decision = "choose";
          shiftKey = false
        }
        //If this is a Opposite Trait roll update the name and targetScore
      } else if (type === 'opptrait') {
        name = item.system.oppName
        targetScore = item.system.oppvalue;
      } else if (type === 'weapon' && actor.type === 'character') {  //If this is a weapon and for a character replace itemnID with the underlying skill id.
        itemId = dataset.sourceid
      } else if (type === 'damage') {
        let subType = dataset.subtype ? dataset.subtype : "";
        if (subType === 'horseCharge'){
          dmgFormula = item.system.chargeDmg;  
        } else if (subType === 'horse'){
          dmgFormula = item.system.damage;
        } else {
          if((actor.type === 'character')) {
            dmgFormula = item.system.damage;
          } else {
            dmgFormula = item.system.dmgForm;  
          }
        }  
          //If there's no damage formula then stop the roll
        if (dmgFormula === "") {return}
      } 
    }
    let rollType = game.i18n.localize('PEN.roll.'+type)
    let msgId = await PENChecks.startCheck ({
        shiftKey,
        partic,
        type,
        label: name,
        rollType,
        reflex,
        opplabel: oppname,
        targetScore,
        oppTargetScore,
        itemId,
        dmgFormula,
        decision,
    })
    return
  }  

  //
  // Start the Roll
  //
  static async startCheck (options = {}) {
    const config = await PENChecks.initiateConfig(options)
    if (config === false) {return}
    let msgId = await PENChecks.runCheck (config)
    return msgId
  } 

  //
  // Set Roll and Dialog options for the check
  //
  static async initiateConfig(options){
    let actor = await PENactorDetails._getParticipant(options.partic.particId, options.partic.particType);
    const config = {
      origin: game.user.id,
      originGM: game.user.isGM,
      shiftKey: options.shiftKey,
      gmRoll: options.gmRoll,
      label: options.label,
      checkType: 'regular',
      rollType: options.rollType,
      opplabel: options.opplabel,
      reflex: options.reflex ? options.reflex : "",
      reverseRoll: false,
      partic: options.partic,
      itemId: options.itemId ? options.itemId: "",
      targetScore: options.targetScore ? options.targetScore : 0,
      oppTargetScore: options.oppTargetScore ? options.oppTargetScore : 0,
      decision: options.decision ? options.decision : "none",
      type: options.type ? options.type : '',               
      rollFormula: options.formula ? options.formula : "1d20",
      dmgFormula: options.dmgFormula ? options.dmgFormula : "",
      critBonus: 0,
      checkBonus: 0,
      reflexMod: 0,
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
    //let actor = await PENactorDetails._getParticipant(config.partic.particId, config.partic.particType);
    //If Shift key has been held or this is a Damage Roll then accept the defaults above otherwise call a Dialog box for Bonus/Penalty
    if (config.shiftKey || config.type === 'damage'){
    } else{
      let usage = await PENChecks.RollDialog(config);
        if (usage) {
            config.checkBonus = Number(usage.get('checkBonus'));
            config.reflexMod = Number(usage.get('reflexMod'));
            config.checkType = usage.get('checkType')
            let tempDecision = usage.get('decisionChoice')
            if (tempDecision == "main" || tempDecision === "opp") {
            config.decision = tempDecision}
        }
      }

    // If a Decision Trait roll where the player is using the opposite trait through choice or by default swap the names and targets around  
    if (config.type === 'decisionTrait' && config.decision === 'opp') {
      let tempName = config.oppname;
      let tempScore = config.oppTargetScore
      config.oppname = config.name;
      config.name = tempName;
      config.oppTargetScore = config.targetScore;
      config.targetScore = tempScore;
    }  

    //Adjust target Score for check Bonus, reflexive Modifier and calculate critBonus where target score > 20 or <0
    config.targetScore = Number(config.targetScore) + Number(config.checkBonus) + Number(config.reflexMod);
    config.grossTarget = config.targetScore
    if (config.targetScore > 20) {
      config.critBonus = config.targetScore - 20;
      config.targetScore = 20;
    } else if (config.targetScore <0) {
      config.critBonus = -config.targetScore;
      config.targetScore = 0;

    }

    let msgId = await PENChecks.makeRoll(config) ;  

    return msgId
  }

  //  
  //Function to call the Modifier Dialog box 
  //
  static async RollDialog (options) {
    const data = {
      type : options.type,
      label: options.label,
      rollType: options.rollType,
      opplabel: options.opplabel,
      decision: options.decision,
      reflex: options.reflex,
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
      },{classes: ["Pendragon", "sheet"]})
      dlg.render(true);
    })
  }

  //
  //Call Dice Roll, calculate Result and store result in rollVal
  //
  static async makeRoll(config) {
    let actor = await PENactorDetails._getParticipant(config.partic.particId, config.partic.particType);
    let dice = config.rollFormula
    if (config.critBonus > 0) {
      dice = dice + "+" + config.critBonus
    }  
    if (config.type === 'damage') {dice = config.dmgFormula};
    let roll = new Roll(dice);
    await roll.roll({ async: true});
    config.roll = roll;
    config.rollResult = Number(config.roll.total);
    //Add the critBonus to the dice roll  but cap the roll it at 20
    config.rollVal = Math.min(Number(config.rollResult),20)
    
  //Get the level of Success
    config.resultLevel = await PENChecks.successLevel(config)

  //If this is a decisionTrait roll and it was failed then consider activating the reverseRoll option  
    if (config.type === 'decisionTrait' && config.resultLevel === 1 && !config.reverseRoll) {
      config.reverseRoll = true;  
    }

  //Create the ChatMessage and Roll Dice
    const html = await PENChecks.startChat(config);
    let msgId = await PENChecks.showChat(html,config);
 
  //If Auto XP game setting is on, result level isnt a fail and roll type allows XP then tick the box
    if (game.settings.get('Pendragon',"autoXP") && config.resultLevel != 1) {
      let checkProp ="";
      if(config.type === 'skill' || config.type === 'passion' || config.type === 'trait' || config.type === 'weapon' || config.type === 'opptrait') {
        checkProp = {'system.XP' : true};
        if ((config.type === 'opptrait' & config.resultLevel != 0) || (config.type === 'trait' & config.resultLevel === 0)) {
          checkProp = {'system.oppXP' : true};
        } 
      } else if (config.type === 'decisionTrait') {
        if ((config.resultLevel > 1 && config.decision === 'main') || (config.resultLevel === 0 && config.decision === 'opp')) {
          checkProp = {'system.XP' : true};
        } else if ((config.resultLevel > 1 && config.decision === 'opp') || (config.resultLevel === 0 && config.decision === 'main')) {
          checkProp = {'system.oppXP' : true};
        }
      }
      if (checkProp != "") {
      const item = actor.items.get(config.itemId);
      await item.update (checkProp);
      }  
    }    

    return msgId
  } 

  //
  // Calculate Success Level
  //
  static async successLevel (config){
    let resultLevel = -1;
      //Bypass result level calc for certain roll types and return -1
      if (config.type === 'damage') {return resultLevel}

      //Otherwise calculate result level
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
      type: config.type,
      rollType: config.rollType,
      reverseRoll: config.reverseRoll,
      label: config.label,
      actorId: actor._id,
      checkBonus: config.checkBonus,
      reflexMod: config.reflexMod,
      dmgFormula: config.dmgFormula,
      partic: config.partic,
      resultLevel : config.resultLevel,
      resultLabel: game.i18n.localize('PEN.resultLevel.'+config.resultLevel),
      result: config.rollVal,
      targetScore: config.targetScore,
      grossTarget: config.grossTarget,
  }
  if (config.checkType === 'opposed') {
    config.chatTemplate = 'systems/Pendragon/templates/chat/opposed-roll-result.html'
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
    return msg._id
  }

//
//Function when Chat Message buttons activated to call socket---------------------------------------------------------------------------------------------------
//
static async triggerChatButton(event){
  const targetElement = event.currentTarget;
  const presetType = targetElement.dataset?.preset;
  const targetChat = $(targetElement).closest('.message');
  let targetChatId = targetChat[0].dataset.messageId;

  let origin = game.user.id;
  let originGM = game.user.isGM;

  //If the user is a GM then run the handle ChatButton otherwise if its a player trigger the socket emit so  GM runs handle ChatButton as they won't have permission themselves
  if (game.user.isGM){
    PENChecks.handleChatButton ({presetType, targetChatId, origin, originGM})
  } else {
    game.socket.emit('system.Pendragon', {
      type: 'chatUpdate',
      value: {presetType, targetChatId, origin, originGM}
    })
  }
}

//
//Use Buttons on Chat Card 
//
static async handleChatButton(data) {
  const presetType = data.presetType;
  let targetMsg = game.messages.get(data.targetChatId);
  let actor = await PENactorDetails._getParticipant(targetMsg.flags.config.partic.particId,targetMsg.flags.config.partic.particType);
  await targetMsg.update({'flags.config.origin' :data.origin, 'flags.config.originGM' : data.originGM})

  //Code to carry out depends on type of button pressed on the chat card
  switch(presetType){

  //For a reverseRoll - the opposite roll on a failed Decistion Trait roll  
    case "reverseRoll":
      //Turn off the revereRoll indicator and update the existing chat message so the button disappears to prevent mutliple rerolls
      await targetMsg.update({
        'flags.config.reverseRoll' : false,
      });
      const pushhtml = await PENChecks.startChat(targetMsg.flags.config);
      await targetMsg.update({content: pushhtml});

      //Now update the config for a new roll, then make the roll normally
      let newType = "";
      if(targetMsg.flags.config.decision === 'main') {
        newType = "opptrait";
      } else {
        newType = "trait";
      }
      
      await targetMsg.update({
        'flags.config.type' : newType,
        'flags.config.reflexMod' : -targetMsg.flags.config.reflexMod,
        'flags.config.label': targetMsg.flags.config.opplabel,
        'flags.config.grossTarget': targetMsg.flags.config.oppTargetScore,
        'flags.config.name' : targetMsg.flags.config.oppname,
        'flags.config.targetScore' : targetMsg.flags.config.oppTargetScore,
      });
      await PENChecks.makeRoll(targetMsg.flags.config);
    break;

  }
  return  

}  

} 