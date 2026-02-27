import { PENCheck } from './checks.mjs';
import { PENactorDetails } from './actorDetails.mjs';

export function addChatListeners(html) {
  html.on('click', '.cardbutton', PENCheck.triggerChatButton)
}

export class ChatCardTemplate {
  static COMBAT = "systems/Pendragon/templates/chat/roll-combat.html";
  static OPPOSED = "systems/Pendragon/templates/chat/roll-opposed.html";
  static UNOPPOSED = "systems/Pendragon/templates/chat/roll-result.html";
  static DECLARE = "systems/Pendragon/templates/chat/declare-action.hbs";
}
export class ChatCardState {
  static OPEN = "open";
  static CLOSED = "closed";
}

export class PENChat {

  //
  //Hides Owner-Only sections of chat message from anyone other than the owner and the GM
  static async renderMessageHook(message, html) {
    ui.chat.scrollBottom();
    html.querySelectorAll(".cardbutton").forEach(b => b.addEventListener('click', PENCheck.triggerChatButton));
    if (!game.user.isGM) {
      const ownerOnly = html.querySelectorAll('.owner-only')
      for (const zone of ownerOnly) {
        let actor = await PENactorDetails._getParticipant(zone.dataset.particId, zone.dataset.particType)
        if ((actor && !actor.isOwner) || (!actor && !game.user.isGM)) {
          zone.style.display = 'none'
        }
      }
    }

    const gmVisibleOnly = html.querySelectorAll('.gm-visible-only')
    for (const elem of gmVisibleOnly) {
      if (!(game.user.isGM)) elem.style.display = 'none'
    }
    return
  }

}
