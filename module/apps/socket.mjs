import { PENChecks } from './checks.mjs';

export class PENSystemSocket {
  
  static async callSocket (data) {
    switch (data.type){
      case 'chatUpdate':
        if (data.to === game.user.id) {
          PENChecks.handleChatButton(data.value);
        }  
      break; 


    }
  }
}