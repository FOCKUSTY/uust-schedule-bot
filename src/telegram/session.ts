import type { Context } from "./bot";

import type { Bot } from "grammy";
import { session } from "grammy";

export interface SessionData {
  registration?: {
    step: "course" | "specialization" | "group";
    course?: string;
    specialization?: string;
  };
  watchType: "day" | "week";
  currentWeekOffset: number;
  currentDayOffset: number;
  lastBotMessageId?: number;
  lastChatId?: number;
}

export function initial(): SessionData {
  return {
    currentWeekOffset: 0,
    currentDayOffset: 0,
    watchType: "day",
  };
}

export class SessionRegister {
  public constructor(
    private readonly bot: Bot<Context>
  ) {}

  public execute() {
    this.bot.use(session({ initial }));
  }
}