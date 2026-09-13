import { env } from "@/env";

import type { CallbackHandler, Context, MyConversation } from "@/types";

import { Bot, session } from "grammy";
import { initialSession } from "./session";

import { CONVERSATIONS } from "./conversations";

import { conversations, createConversation } from "@grammyjs/conversations";
import {
  ConfigHandler,
  GroupsScheduleHandler,
  MenuHandler,
  ScheduleHandler,
} from "./handlers";
import { COMMANDS } from "./commands";

export const bot = new Bot<Context>(env.TELEGRAM_BOT_TOKEN);

bot.use(session({ initial: () => initialSession }));

bot.use(conversations<Context, Context>());
CONVERSATIONS.forEach(([name, conversation]) => {
  bot.use(
    createConversation(
      (myConversation: MyConversation, context: Context) =>
        conversation.execute.call(conversation, myConversation, context),
      name,
    ),
  );
});

COMMANDS.forEach((command) => {
  bot.command(command.name, command);
});

export const callbackHandlers = new Map<string, CallbackHandler>();

new ScheduleHandler(callbackHandlers).execute();
new MenuHandler(callbackHandlers).execute();

const handlers = [new ConfigHandler(), new GroupsScheduleHandler()];

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
    const handler = verifiedHandler as (typeof handlers)[number] | null;
    if (!handler) {
      return;
    }

    return handler.handle(ctx);
  }

  return ctx.answerCallbackQuery("Неизвестное действие").catch(console.error);
});

bot.start({
  onStart: (botInfo) => {
    console.log("Bot started as " + botInfo.username);
  },
});

bot.catch((error) => {
  return console.error(error);
});
