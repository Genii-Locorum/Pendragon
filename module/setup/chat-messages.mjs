import { PENChat } from '../apps/chat.mjs'

export function listen(){
  Hooks.on('renderChatMessageHTML', (app, html, data) => {
    PENChat.renderMessageHook(app, html, data)
  })
}