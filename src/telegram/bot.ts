import { env } from "../env";
import { Bot, InlineKeyboard } from "grammy";

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

bot.command("start", (interaction) => {
  const keyboard = new InlineKeyboard()
    .append(new InlineKeyboard().text("Выбрать курс"))
    .append(new InlineKeyboard().text("Выбрать специальность"))
    .append(new InlineKeyboard().text("Выбрать группу"))

  return interaction.reply("Бе-бе-бе", {
    reply_markup: keyboard,
  });
});

bot.on('callback_query:data', (interaction) => {
  console.log(interaction.update.callback_query.data);
});

bot.start();