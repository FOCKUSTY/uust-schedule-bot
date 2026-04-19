import type { Context as GrammyContext, SessionFlavor } from "grammy";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";

import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

import { env } from "../env";
import { UserService } from "../database/user.service";
import { initialSession, SessionData } from "./session";
import { CALLBACK_DATA } from "./constants/callback-data";
import { NavigationService } from "./services/navigation.service";

import {
  REGISTRATION_CONVERSATION,
  registrationConversation,
} from "./conversations/registration";
import {
  SCHEDULE_CONVERSATION,
  scheduleConversation,
} from "./conversations/schedule";

import { start } from "./commands/start";
import { menuCallbackHandler } from "./menu/menu.handler";
import { configSelectionKeyboard, mainMenuKeyboard } from "./keyboards";
import { sendOrEditMessage } from "./utils/send-or-edit";

export type Context = SessionFlavor<SessionData> &
  ConversationFlavor<GrammyContext>;
export type MyConversation = Conversation<Context, Context>;

export const bot = new Bot<Context>(env.TELEGRAM_BOT_TOKEN);

const userService = new UserService();
const navigation = new NavigationService();

// Middleware
bot.use(session({ initial: () => initialSession() }));
bot.use(conversations<Context, Context>());

// Регистрация диалогов
bot.use(
  createConversation<Context, Context>(
    (conversation, context) => registrationConversation(conversation, context),
    REGISTRATION_CONVERSATION,
  ),
);
bot.use(
  createConversation<Context, Context>(
    (conversation, context) => scheduleConversation(conversation, context),
    SCHEDULE_CONVERSATION,
  ),
);

// Команды
bot.command("schedule", async (ctx) => {
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
bot.command("start", start);

// Словарь обработчиков callback-запросов
type CallbackHandler = (ctx: Context) => Promise<void>;
const callbackHandlers = new Map<string, CallbackHandler>();

// Навигация неделя
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_WEEK_PREV, async (ctx) => {
  navigation.changeWeekOffset(ctx.session, -1);
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_WEEK_NEXT, async (ctx) => {
  navigation.changeWeekOffset(ctx.session, 1);
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_WEEK_RESET, async (ctx) => {
  navigation.resetWeekOffset(ctx.session);
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});

// Навигация день
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_DAY_PREV, async (ctx) => {
  navigation.changeDayOffset(ctx.session, -1);
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_DAY_NEXT, async (ctx) => {
  navigation.changeDayOffset(ctx.session, 1);
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_DAY_RESET, async (ctx) => {
  navigation.resetDayOffset(ctx.session);
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});

// Переключение режима просмотра
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_SWITCH_TODAY, async (ctx) => {
  navigation.setWatchType(ctx.session, "day");
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_SWITCH_TOWEEK, async (ctx) => {
  navigation.setWatchType(ctx.session, "week");
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});

// Основной обработчик callback_query
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const telegramId = ctx.from?.id;

  // Сначала проверяем точные совпадения в словаре
  const handler = callbackHandlers.get(data);
  if (handler) {
    return handler(ctx);
  }

  // Обработка menu
  if (data.startsWith("menu:")) {
    return menuCallbackHandler(ctx);
  }

  // Обработка выбора конфигурации
  if (data.startsWith(`${CALLBACK_DATA.SELECT_CONFIG}:`)) {
    const [, dataConfigId, type] = data.split(":");
    const configId = parseInt(dataConfigId);

    try {
      if (type === "default") {
        await userService.toggleDefaultConfig(telegramId, configId);
      } else {
        await userService.toggleConfigActive(telegramId, configId);
      }

      await ctx.answerCallbackQuery("✅ Группа выбрана");
      return sendOrEditMessage(ctx, "Главное меню", {
        keyboard: mainMenuKeyboard(),
      });
    } catch {
      await ctx.answerCallbackQuery("❌ Эта группа недоступна");

      const configs = await userService.getUserConfigs(telegramId);
      const keyboard = configSelectionKeyboard(configs);

      return sendOrEditMessage(ctx, "Пожалуйста, выберите группу из списка:", {
        keyboard,
      });
    }
  }

  // Неизвестная команда
  await ctx.answerCallbackQuery("Неизвестное действие");
});

bot.start({
  onStart: (botInfo) => {
    console.log("Bot started as " + botInfo.username);
  },
});
