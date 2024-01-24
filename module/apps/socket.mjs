import { PENCheck } from './checks.mjs';
import { OPCard } from './opposed-card.mjs';

export class PENSystemSocket {
  
  static async callSocket (data) {
    switch (data.type){
      case 'chatUpdate':
        if (data.to === game.user.id) {
          PENCheck.handleChatButton(data.value);
        }  
      break; 
      case 'OPAdd':
        if (data.to === game.user.id) {
          OPCard.OPAdd(data.value.config, data.value.msgId);
        }  
      break; 

    }
  }
}