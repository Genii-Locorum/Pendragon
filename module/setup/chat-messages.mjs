import { PENChat } from '../apps/chat.mjs'

export function listen(){
  Hooks.on('renderChatMessage', (app, html, data) => {
    PENChat.renderMessageHook(app, html, data)
  })
}