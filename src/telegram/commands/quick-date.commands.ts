import type { Context } from "@/types";
import { ScheduleConversation } from "../conversations";

export const today = (ctx: Context) => {
  ctx.session.quickDate = "today";
  return ctx.conversation.enter(ScheduleConversation.name);
};

export const tomorrow = (ctx: Context) => {
  ctx.session.quickDate = "tomorrow";
  return ctx.conversation.enter(ScheduleConversation.name);
};
