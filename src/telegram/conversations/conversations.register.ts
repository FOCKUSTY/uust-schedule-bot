import type { Context } from "../bot";
import type { Bot } from "grammy";

import { REGISTRATION_CONVERSATION, registrationConversation } from "./registration";
import { SCHEDULE_CONVERSATION, scheduleConversation } from "./schedule";
import { conversations, createConversation } from "@grammyjs/conversations";

const CONVERSATIONS = [
  [REGISTRATION_CONVERSATION, registrationConversation],
  [SCHEDULE_CONVERSATION, scheduleConversation]
] as const;

export class ConversationsRegister {
  public constructor(
    private readonly bot: Bot<Context>,
  ) {}

  public execute() {
    this.bot.use(conversations<Context, Context>());

    CONVERSATIONS.forEach(([name, func]) => {
      this.bot.use(createConversation(func, name));
    });
  }
}