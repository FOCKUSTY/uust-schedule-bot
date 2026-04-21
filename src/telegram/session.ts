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
  quickConfigGroup: string|null;
  quickDate: "none" | "today" | "tomorrow";
  currentWeekOffset: number;
  currentDayOffset: number;
  lastBotMessageId?: number;
  lastChatId?: number;
}

export function initial(): SessionData {
  return {
    currentWeekOffset: 0,
    currentDayOffset: 0,
    quickConfigGroup: null,
    watchType: "day",
    quickDate: "today",
  };
}

export class SessionRegister {
  public constructor(private readonly bot: Bot<Context>) {}

  public execute() {
    this.bot.use(session({ initial }));
  }
}
