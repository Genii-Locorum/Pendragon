import { PENCheck } from './checks.mjs';

export class OPCard {  
  
  //Add a new skill etc to an Opposed Card
  static async OPAdd (config, msgId) {
    if (game.user.isGM) {
      let targetMsg = await game.messages.get(msgId)
      if ((targetMsg.flags.Pendragon.chatCard).length >=2 && ['OP', 'CO'].includes(targetMsg.flags.Pendragon.cardType)) {
        ui.notifications.warn(game.i18n.localize('PEN.resolveMax'))    
        return
      }

      let newChatCards = targetMsg.flags.Pendragon.chatCard
      newChatCards.push(config.chatCard[0])
      await targetMsg.update({'flags.Pendragon.chatCard' :newChatCards})
      const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon)
      await targetMsg.update({content: pushhtml})
    } else {
      const availableGM = game.users.find(d => d.active && d.isGM)?.id
      if (availableGM) {
        game.socket.emit('system.Pendragon', {
          type: 'OPAdd',
          to: availableGM,
          value: {config, msgId}
        })
      } else {
        ui.notifications.warn(game.i18n.localize('PEN.noAvailableGM'))     
      }
    }
  }

  
  //Remove a skill etc from an oppossed card
  static async OPRemove (config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    let rank = config.dataset.rank
    let newChatCards =targetMsg.flags.Pendragon.chatCard
    newChatCards.splice(rank, 1)
    await targetMsg.update({'flags.Pendragon.chatCard' :newChatCards})
    return
  }


  //Resolve a combined card - roll dice, update and close
  static async OPResolve (config) {
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
        comboOutcome = "W/P"
        break
      case 31:
      case 30: 
      case 21:
      case 20:   
        comboOutcome = "W/L"
        break        
      case 23:
        comboOutcome = "P/W"
        break        
      case 13:
      case 12:
      case 3:
      case 2:
      comboOutcome = "L/W"
        break
      case 11:
      case 10:
      case 1:
      case 0:        
        comboOutcome = "L/L"
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
      newchatCards.push(chatCards[cCount])
      await OPCard.showDiceRoll(chatCards[cCount],game.settings.get("Pendragon",`oppDice${cCount+1}`))  
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
  
  
  //Check to see if there is an open card that matches the cardTyoe that's not more than a day old
  static async checkNewMsg (config) {  
    let messages = ui.chat.collection.filter(message => {
      if (  config.cardType === message.getFlag('Pendragon', 'cardType') &&  message.getFlag('Pendragon', 'state') !== 'closed'){
        return true
     }
    })

    if (messages.length) {
      // Old messages can't be used if message is more than a day old mark it as resolved
      const timestamp = new Date(messages[0].timestamp)
      const now = new Date()
      const timeDiffSec = (now - timestamp) / 1000
      if (60 * 60 *24 < timeDiffSec) {
        await messages[0].setFlag('Pendragon', 'state', 'closed')
        messages = []
      }
    }

    if (!messages.length) {return false}
    else {return messages[0].id}
  }


  static async OPClose (config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    await targetMsg.update({'flags.Pendragon.state': 'closed',
                            'flgs.Pendragon.successLevel': -1,
                            'flags.Pendragon.chatCard' :[]})
    const pushhtml = await PENCheck.startChat(targetMsg.flags.Pendragon)
    await targetMsg.update({content: pushhtml})                        
    return
  } 

  static async showDiceRoll(chatCard,color) {  
    //If this is an Opposed or Combat roll then for the dice to roll if Dice so Nice used
      if (game.modules.get('dice-so-nice')?.active) {
        const diceData = {
          throws:[{
            dice:[
              {
                resultLabel:chatCard.rollResult,
                result:chatCard.rollResult,
                type:"d20",
                options: {colorset:color},  
                vectors:[]
              }
            ]
          }]
        }
        game.dice3d.show(diceData,game.user,true,null,false)  //Dice Data,user,sync,whispher,blind
      }  
  }

}