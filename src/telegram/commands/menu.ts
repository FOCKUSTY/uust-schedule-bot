import { Context } from "../bot";
import { mainMenuKeyboard } from "../keyboards";

export const menu = (ctx: Context) => {
  return ctx.reply("Главное меню", {
    reply_markup: mainMenuKeyboard()
  });
}