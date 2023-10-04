import * as RenderItemSheet from './render-item-sheet.mjs'
import * as RenderActorSheet from './render-actor-sheet.mjs'
import * as RenderChatMessage from '../setup/chat-messages.mjs'
import * as Init from './init.mjs'

export const PendragonHooks = {
    listen () {
      Init.listen()
        RenderActorSheet.listen()
        RenderItemSheet.listen()
        RenderChatMessage.listen()
    }
  }