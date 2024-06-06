import { PENCheck } from '../apps/checks.mjs';
import { OPCard } from "./opposed-card.mjs";
import { PENactorDetails } from "../apps/actorDetails.mjs";

export class COCard {  
  
  //Resolve a combined card - roll dice, update and close
  static async COResolve (config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    let chatCards =targetMsg.flags.Pendragon.chatCard
    if (chatCards.length <2) {
      ui.notifications.warn(game.i18n.localize('PEN.resolveMore'))
      return}

    let comboResult = (chatCards[0].resultLevel * 10) + chatCards[1].resultLevel
    let comboOutcome = ""
    switch (comboResult) {
      case 33:
        comboOutcome = "T/T"
        break
      case 32:
        comboOutcome = "C/P"
        break
      case 31:
        comboOutcome = "C/L"
        break        
      case 30: 
        comboOutcome = "C/F"
        break      
      case 23:
        comboOutcome = "P/C"
        break  
      case 21:
        comboOutcome = "W/L"
        break        
      case 20:   
        comboOutcome = "W/F"
        break 
      case 13:
        comboOutcome = "L/C"
        break         
      case 12:
        comboOutcome = "L/W"
        break         
      case 11:
        comboOutcome = "L/L"
        break         
      case 10:
        comboOutcome = "L/F"
        break                 
      case 3:
        comboOutcome = "F/C"
        break
      case 2:
      comboOutcome = "F/W"
        break
      case 1:
        comboOutcome = "F/L"
        break        
      case 0:        
        comboOutcome = "F/F"
        break
      case 22:
        if (chatCards[0].rollVal === chatCards[1].rollVal ) {
          comboOutcome = "T/T"
        } else if (chatCards[0].rollVal > chatCards[1].rollVal ) {
          comboOutcome = "W/P"
        } else {
          comboOutcome = "P/W"  
        } 
        break
    }

    let result = comboOutcome.split("/")
    let newchatCards = []
    for ( let cCount=0; cCount<2; cCount++) {
      chatCards[cCount].outcome = result[cCount]    
      chatCards[cCount].outcomeLabel = game.i18n.localize('PEN.comRoll'+result[cCount])

      //If Critical, Tie or Win then allow Damage Roll
      if (['C', 'T', 'W'].includes(result[cCount])) {
        chatCards[cCount].damRoll = true
      }

      //If Critical then set Damage Roll to critical
      if (['C'].includes(result[cCount])) {
        chatCards[cCount].damCrit = true
      }

      //If made Dodge or Evade roll then don't cause damage
      if (['evade','dodge'].includes(chatCards[cCount].action)) {
        chatCards[cCount].damRoll = false
        chatCards[cCount].damCrit = false
      }

      //Set Shield Use if Partial Success or better and opponent is causing damage
      if (['C', 'T', 'W','P'].includes(result[cCount])) {
        if (['C', 'T', 'W'].includes(result[1-cCount])){
          chatCards[cCount].damShield = true
          
        }
      }      


      newchatCards.push(chatCards[cCount])
      await OPCard.showDiceRoll(chatCards[cCount])  
      if (game.settings.get('Pendragon','autoXP') && chatCards[cCount].resultLevel != 1) {
        await PENCheck.tickXP (chatCards[cCount])
      } 
    } 


    await targetMsg.update({'flags.Pendragon.chatCard' :newchatCards,
                            'flags.Pendragon.state': 'closed',
                          })
    const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon)
    await targetMsg.update({content: pushhtml})    
    return
  }


  //Generate Damage Roll off the Combat Roll Damage Button
  static async combatDamageRoll(config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    let rank = config.dataset.rank

    //Turn off the DamageRoll button for the clicked button and update the existing chat message so the button disappears to prevent mutliple rerolls
    let chatCards =targetMsg.flags.Pendragon.chatCard
    chatCards[rank].damRoll = false
    let newChatCards = []
    for (let cCard of chatCards) {
      newChatCards.push(cCard)
    } 
    await targetMsg.update({
      'flags.Pendragon.chatCard' : newChatCards,
    });
    const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon);
    await targetMsg.update({content: pushhtml});

    //Prep the damage roll with details from combat roll
    let actor = null
    let token = null
    if (targetMsg.flags.Pendragon.chatCard[rank].particType === 'actor') {
      actor = await PENactorDetails._getParticipant(targetMsg.flags.Pendragon.chatCard[rank].particId, targetMsg.flags.Pendragon.chatCard[rank].particType)    
    } else if (targetMsg.flags.Pendragon.chatCard[rank].particType === 'token') {
      token = await PENactorDetails._getParticipant(targetMsg.flags.Pendragon.chatCard[rank].particId, targetMsg.flags.Pendragon.chatCard[rank].particType)
    } else {return} 

    await PENCheck._trigger({
      rollType: 'DM',
      cardType: 'NO',
      shiftKey: true,
      damCrit: targetMsg.flags.Pendragon.chatCard[rank].damCrit,
      itemId: targetMsg.flags.Pendragon.chatCard[rank].itemId,
      actor: actor,
      token: token
      });    
    return
  }

}