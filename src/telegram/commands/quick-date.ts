import type { Context } from "../bot";
import { SCHEDULE_CONVERSATION } from "../conversations/schedule";

export const today = (ctx: Context) => {
  ctx.session.quickDate = "today";
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
}

export const tomorrow = (ctx: Context) => {
  ctx.session.quickDate = "tomorrow";
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
}