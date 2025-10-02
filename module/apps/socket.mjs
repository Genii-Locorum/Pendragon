import { PENCheck } from './checks.mjs';
import { OPCard } from '../cards/opposed-card.mjs';

export class PENSystemSocket {

  static async callSocket (data) {
    //If a target (to) is specified then only carry this out if its this user
    if (!!data.to && game.userId !== data.to) {return}
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
        case 'toggleMapNotes':
          game.settings.set('core', NotesLayer.TOGGLE_SETTING, data.toggle === true)
          break
    }
  }
}