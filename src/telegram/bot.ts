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

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  const handler = callbackHandlers.get(data);
  if (handler) {
    return handler(ctx);
  }

  const promiseData = await Promise.all([
    configHandler.handle(ctx)
  ]);

  if (promiseData.every(data => data !== "NON")) {
    return;
  }

  await ctx.answerCallbackQuery("Неизвестное действие");
});

bot.start({
  onStart: (botInfo) => {
    console.log("Bot started as " + botInfo.username);

    listen();
  },
});
