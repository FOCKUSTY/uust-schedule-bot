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
import { CallbackRegister } from "./handlers/callback.register";

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

export const callbackRegistry = new CallbackRegister();
callbackRegistry.add(
  ScheduleHandler,
  MenuHandler,
  ConfigHandler,
  GroupsScheduleHandler,
);

bot.on("callback_query:data", (ctx) => callbackRegistry.dispatch(ctx));

bot.start({
  onStart: (botInfo) => {
    console.log("Bot started as " + botInfo.username);
  },
});

bot.catch((error) => {
  return console.error(error);
});
