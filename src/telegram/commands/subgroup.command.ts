import { Context } from "@/types";
import { InlineKeyboard } from "grammy";
import { sendOrEditMessage } from "../utils";

export const subgroup = async (ctx: Context) => {
  const keyboard = new InlineKeyboard()
    .text("1 п/п", "set_subgroup:1")
    .row()
    .text("2 п/п", "set_subgroup:2")
    .row()
    .text("❌ Сбросить выбор", "set_subgroup:none")
    .row();

  await sendOrEditMessage(
    ctx,
    "👥 Выберите вашу подгруппу (она будет отображаться первой):",
    {
      keyboard,
    },
  );
};
