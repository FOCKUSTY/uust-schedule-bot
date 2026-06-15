import type { Message } from "grammy/types"
import { bot } from "../bot"

export const deleteMessage = (chat: number | string, delay: number = 5_000) => {
  return (message: Message) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        bot.api.deleteMessage(chat, message.message_id)
          .then(resolve)
          .catch(reject);
      }, delay);
    })
  }
}