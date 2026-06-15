import { env } from "../../env";
import { Context } from "../bot";
import { BROADCAST_CONVERSATION } from "../conversations/broadcast";

export const broadcast = async (ctx: Context) => {
  if (ctx.from?.id !== env.BOT_CREATOR_ID) {
    return ctx.reply("Команда для Вас не доступна.");
  }

  return ctx.conversation.enter(BROADCAST_CONVERSATION);
};
