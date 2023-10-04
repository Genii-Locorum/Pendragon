import { PENChecks } from './checks.mjs';

export class PENSystemSocket {
  
  static async callSocket (data) {
    switch (data.type){
      case 'chatUpdate':
        if (game.user.isGM) {
          PENChecks.handleChatButton(data.value);
        }  
      break; 


    }
  }
}