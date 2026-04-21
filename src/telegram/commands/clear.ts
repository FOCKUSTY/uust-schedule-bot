import type { Context } from "../bot";

export const clear = (ctx: Context) => {
  ctx.session.currentDayOffset = 0;
  ctx.session.currentWeekOffset = 0;
  ctx.session.lastBotMessageId = undefined;
  ctx.session.lastChatId = undefined;
  ctx.session.quickDate = "none";
  ctx.session.watchType = "day";

  return ctx.reply("Настройки сессии были сброшены");
};
