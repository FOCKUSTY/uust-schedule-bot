import { Context } from "@/types";
import { mainMenuKeyboard } from "../keyboards";

export const menu = (ctx: Context) => {
  return ctx.reply("Главное меню", {
    reply_markup: mainMenuKeyboard(),
  });
};
