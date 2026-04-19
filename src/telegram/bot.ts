import { env } from "../env";

import type { SessionData } from "./session";
import type { Context as GrammyContext, SessionFlavor } from "grammy";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";

import { conversations, createConversation } from "@grammyjs/conversations";
import { Bot, session } from "grammy";

import {
  REGISTRATION_CONVERSATION,
  registrationConversation,
} from "./conversations/registration";
import {
  SCHEDULE_CONVERSATION,
  scheduleConversation,
} from "./conversations/schedule";

import { initialSession } from "./session";
import { start } from "./commands/start";
import { menuCallbackHandler } from "./menu/menu.handler";
import { UserService } from "../database/user.service";
import { configSelectionKeyboard, mainMenuKeyboard } from "./keyboards";
import { sendOrEditMessage } from "./utils/send-or-edit";
import { resolveDayOffset } from "./schedule";

export type Context = SessionFlavor<SessionData> &
  ConversationFlavor<GrammyContext>;
export type MyConversation = Conversation<Context, Context>;

export const bot = new Bot<Context>(env.TELEGRAM_BOT_TOKEN);

const userService = new UserService();

bot.use(session({ initial: () => initialSession() }));
bot.use(conversations<Context, Context>());

bot.use(
  createConversation<Context, Context>((conversation, context) => {
    return registrationConversation(conversation, context);
  }, REGISTRATION_CONVERSATION),
);

bot.use(
  createConversation<Context, Context>((conversation, context) => {
    return scheduleConversation(conversation, context);
  }, SCHEDULE_CONVERSATION),
);

bot.command("schedule", async (interaction) => {
  await interaction.conversation.enter(SCHEDULE_CONVERSATION);
});

bot.command("start", start);

bot.on("callback_query:data", async (interaction) => {
  const data = interaction.callbackQuery.data;
  const telegramId = interaction.from?.id;

  if (data.startsWith("schedule:")) {
    const data = interaction.callbackQuery?.data;
    switch (data) {
      case "schedule:week:previous":
        interaction.session.currentWeekOffset -= 1;
        await interaction.conversation.enter(SCHEDULE_CONVERSATION);
        break;

      case "schedule:week:next":
        interaction.session.currentWeekOffset += 1;
        await interaction.conversation.enter(SCHEDULE_CONVERSATION);
        break;

      case "schedule:week:reset":
        interaction.session.currentWeekOffset = 0;
        await interaction.conversation.enter(SCHEDULE_CONVERSATION);
        break;

      case "schedule:day:previous":
        interaction.session.currentDayOffset -= 1;
        await interaction.conversation.enter(SCHEDULE_CONVERSATION);
        break;

      case "schedule:day:next":
        interaction.session.currentDayOffset += 1;
        await interaction.conversation.enter(SCHEDULE_CONVERSATION);
        break;

      case "schedule:day:reset":
        interaction.session.currentDayOffset = 0;
        await interaction.conversation.enter(SCHEDULE_CONVERSATION);
        break;

      case "schedule:switch:today":
        interaction.session.watchType = "day";
        await interaction.conversation.enter(SCHEDULE_CONVERSATION);
        break;

      case "schedule:switch:toweek":
        interaction.session.watchType = "week";
        await interaction.conversation.enter(SCHEDULE_CONVERSATION);
        break;

      default:
        await interaction.answerCallbackQuery("Неизвестное действие");
    }
  }

  if (data.startsWith("menu:")) {
    await menuCallbackHandler(interaction);
    return;
  }

  if (data.startsWith("select_config:")) {
    const [, dataConfigId, type] = data.split(":");
    const configId = parseInt(dataConfigId);

    try {
      if (type === "default") {
        await userService.toggleDefaultConfig(telegramId, configId);
      } else {
        await userService.toggleConfigActive(telegramId, configId);
      }

      await interaction.answerCallbackQuery("✅ Группа выбрана");

      return sendOrEditMessage(interaction, "Главное меню", {
        keyboard: mainMenuKeyboard(),
      });
    } catch {
      await interaction.answerCallbackQuery("❌ Эта группа недоступна");

      const configs = await userService.getUserConfigs(telegramId);
      const keyboard = configSelectionKeyboard(configs);

      return sendOrEditMessage(
        interaction,
        "Пожалуйста, выберите группу из списка:",
        { keyboard },
      );
    }
  }
});

bot.start({
  onStart: (botInfo) => {
    console.log("Bot started as " + botInfo.username);
  },
});
