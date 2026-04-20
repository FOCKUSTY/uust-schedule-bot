import type { Context } from "../bot";

import { SCHEDULE_CONVERSATION } from "../conversations/schedule";

export const schedule = (ctx: Context) => {
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
};
