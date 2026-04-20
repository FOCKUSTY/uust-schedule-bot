import { env } from "../env";

import type { Context as GrammyContext, SessionFlavor } from "grammy";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";

import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";

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

import { extractIdFromUrl } from "../schedule/google";
import { ScheduleCache } from "../cache";
import { GoogleDriveService, ScheduleLoader } from "../schedule";
import { NotificationService } from "../notifications/notification.service";
import { ScheduleWatcher } from "../watcher/schedule-watcher";

import { listen } from "./app";

export type Context = SessionFlavor<SessionData> &
  ConversationFlavor<GrammyContext>;
export type MyConversation = Conversation<Context, Context>;

export const bot = new Bot<Context>(env.TELEGRAM_BOT_TOKEN);

const userService = new UserService();
const navigation = new NavigationService();

bot.use(session({ initial: () => initialSession() }));
bot.use(conversations<Context, Context>());

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

bot.command("schedule", async (ctx) => {
  await ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
bot.command("start", start);

type CallbackHandler = (ctx: Context) => Promise<void>;
const callbackHandlers = new Map<string, CallbackHandler>();

callbackHandlers.set(CALLBACK_DATA.SCHEDULE_WEEK_PREV, async (ctx) => {
  navigation.changeWeekOffset(ctx.session, -1);
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_WEEK_NEXT, async (ctx) => {
  navigation.changeWeekOffset(ctx.session, 1);
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_WEEK_RESET, async (ctx) => {
  navigation.resetWeekOffset(ctx.session);
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
});

callbackHandlers.set(CALLBACK_DATA.SCHEDULE_DAY_PREV, async (ctx) => {
  navigation.changeDayOffset(ctx.session, -1);
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_DAY_NEXT, async (ctx) => {
  navigation.changeDayOffset(ctx.session, 1);
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_DAY_RESET, async (ctx) => {
  navigation.resetDayOffset(ctx.session);
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
});

callbackHandlers.set(CALLBACK_DATA.SCHEDULE_SWITCH_TODAY, async (ctx) => {
  navigation.setWatchType(ctx.session, "day");
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
});
callbackHandlers.set(CALLBACK_DATA.SCHEDULE_SWITCH_TOWEEK, async (ctx) => {
  navigation.setWatchType(ctx.session, "week");
  return ctx.conversation.enter(SCHEDULE_CONVERSATION);
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const telegramId = ctx.from?.id;

  const handler = callbackHandlers.get(data);
  if (handler) {
    return handler(ctx);
  }

  if (data.startsWith("menu:")) {
    return menuCallbackHandler(ctx);
  }

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

  if (data.startsWith("schedule:")) {
    switch (data) {
      case CALLBACK_DATA.SCHEDULE_SWITCH_GROUP:
        const configs = await userService.getUserConfigs(telegramId);
        if (configs.length === 0) {
          return sendOrEditMessage(
            ctx,
            "У вас нет сохранённых групп. Начните регистрацию: /start",
            {},
          );
        }

        const keyboard = configSelectionKeyboard(configs);
        await sendOrEditMessage(
          ctx,
          "Выберите группу для активации или добавьте новую:",
          { keyboard },
        );
        await ctx.answerCallbackQuery();
        break;

      default:
        break;
    }
  }

  await ctx.answerCallbackQuery("Неизвестное действие");
});

bot.start({
  onStart: (botInfo) => {
    console.log("Bot started as " + botInfo.username);

    listen();
  },
});

const rootFolderId = extractIdFromUrl(env.GOOGLE_DRIVE_FOLDER_URL);
if (!rootFolderId) {
  throw new Error("Invalid GOOGLE_DRIVE_FOLDER_URL");
}

const driveService = new GoogleDriveService(rootFolderId);
const cache = new ScheduleCache();
const loader = new ScheduleLoader(driveService);
const notificationService = new NotificationService(bot, userService);

const watcher = new ScheduleWatcher(
  driveService,
  cache,
  loader,
  notificationService,
  {
    intervalMs: env.WATCHER_INTERVAL_MINUTES * 60 * 1000,
  },
);

cache.loadAll().then(() => {
  watcher.start();
  console.log(
    `Schedule watcher started with interval ${env.WATCHER_INTERVAL_MINUTES} min`,
  );
});

process.on("SIGINT", () => {
  watcher.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  watcher.stop();
  process.exit(0);
});
