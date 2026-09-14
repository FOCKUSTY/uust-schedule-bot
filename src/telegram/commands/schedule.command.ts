import { Context } from "@/types";
import { ScheduleConversation } from "../conversations";

export const schedule = (ctx: Context) => {
  return ctx.conversation.enter(ScheduleConversation.name);
};
