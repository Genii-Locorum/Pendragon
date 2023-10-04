import { PENChecks } from '../apps/checks.mjs';
import { PENactorDetails } from '../apps/actorDetails.mjs';

export function addChatListeners(html) {
  html.on('click', '.cardbutton', PENChecks.triggerChatButton)
  return
}


export class PENChat{

//
//Hides Owner-Only sections of chat message from anyone other than the owner and the GM  
static async renderMessageHook (message, html) {
  ui.chat.scrollBottom()
  if (!game.user.isGM) {
    const ownerOnly = html.find('.owner-only')
    const actor = await PENactorDetails._getParticipant(message.flags.config.partic.particId,message.flags.config.partic.particType);
    for (const zone of ownerOnly) {
      if ((actor && !actor.isOwner) || (!actor && !game.user.isGM)) {
        zone.style.display = 'none'
      } 
    }
  }
  return
}

}