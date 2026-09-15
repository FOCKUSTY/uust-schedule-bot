import type { Context } from "@/types";
import { ScheduleConversation } from "../conversations";
import { QUICK_DATE } from "@/constants";

export const today = (ctx: Context) => {
  ctx.session.quickDate = QUICK_DATE.TODAY;
  return ctx.conversation.enter(ScheduleConversation.name);
};

export const tomorrow = (ctx: Context) => {
  ctx.session.quickDate = QUICK_DATE.TOMORROW;
  return ctx.conversation.enter(ScheduleConversation.name);
};
