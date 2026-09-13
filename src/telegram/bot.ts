import { env } from "@/env";

import type { Context, MyConversation } from "@/types";

import { Bot, session } from "grammy";
import { initialSession } from "./session";

import {
  CONVERSATIONS,
  RegistrationConversation,
  ScheduleConversation,
} from "./conversations";
import { conversations, createConversation } from "@grammyjs/conversations";
import { UserService } from "@/database";
import { sendOrEditMessage } from "./utils";
import { configSelectionKeyboard } from "./keyboards";

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

const userService = new UserService();

bot.command("start", async (ctx) => {
  const id = ctx.from?.id;
  if (!id) {
    throw new Error("id is not defined.");
  }

  const configs = await userService.getUserConfigs(id);
  if (configs.length === 0) {
    return ctx.conversation.enter(RegistrationConversation.name);
  }

  const activeConfigs = configs.filter(({ actived }) => actived);
  if (activeConfigs.length === 0) {
    return sendOrEditMessage(ctx, "Выберите группу", {
      keyboard: configSelectionKeyboard(configs),
    });
  }

  return ctx.conversation.enter(ScheduleConversation.name);
});

bot.start({
  onStart: (botInfo) => {
    console.log("Bot started as " + botInfo.username);
  },
});

bot.catch((error) => {
  return console.error(error);
});
