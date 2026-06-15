import { env } from "../../env";
import { Context } from "../bot";
import {
  CREATOR_SEND_CONVERSATION,
  SEND_CONVERSATION,
} from "../conversations/send";

export const send = (ctx: Context) => {
  if (ctx.from!.id === env.BOT_CREATOR_ID) {
    return ctx.conversation.enter(CREATOR_SEND_CONVERSATION);
  }

  return ctx.conversation.enter(SEND_CONVERSATION);
};
