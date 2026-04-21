import { env } from "../env";

import type { Context as GrammyContext, SessionFlavor } from "grammy";
import type { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import type { SessionData } from "./session";

import { Bot } from "grammy";

import { ScheduleHandler } from "./handlers/schedule.handler";
import { MenuHandler } from "./handlers/menu.handler";
import { ConfigHandler } from "./handlers/config.handler";

import { ConversationsRegister } from "./conversations/conversations.register";
import { CommandsRegister } from "./commands/commands.register";
import { SessionRegister } from "./session";

import { listen } from "./app";
import { GroupsScheduleHandler } from "./handlers/groups-schedule.handler";

export type Context = SessionFlavor<SessionData> &
  ConversationFlavor<GrammyContext>;
export type MyConversation = Conversation<Context, Context>;

export const bot = new Bot<Context>(env.TELEGRAM_BOT_TOKEN);

export type CallbackHandler = (ctx: Context) => Promise<unknown>;
export const callbackHandlers = new Map<string, CallbackHandler>();

new SessionRegister(bot).execute();
new ConversationsRegister(bot).execute();
new CommandsRegister(bot).execute();

new ScheduleHandler(callbackHandlers).execute();
new MenuHandler(callbackHandlers).execute();

const configHandler = new ConfigHandler();
const groupsScheuldeHandler = new GroupsScheduleHandler();

const handlers = [configHandler, groupsScheuldeHandler];

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  const handler = callbackHandlers.get(data);
  if (handler) {
    return handler(ctx);
  }

  let verifiedHandler: (typeof handlers)[number] | null = null;
  if (
    handlers.some((handler) => {
      const verified = handler.verify(data);

      if (verified) {
        return (verifiedHandler = handler);
      }

      return verified;
    })
  ) {
    const h = verifiedHandler as (typeof handlers)[number] | null;
    if (!h) {
      return;
    }

    return h.handle(ctx);
  }

  return ctx.answerCallbackQuery("Неизвестное действие").catch(console.error);
});

bot.start({
  onStart: (botInfo) => {
    console.log("Bot started as " + botInfo.username);

    listen();
  },
});

bot.catch((error) => {
  return console.error(error);
});
