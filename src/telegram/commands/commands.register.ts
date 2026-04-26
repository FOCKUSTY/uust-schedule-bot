import type { Context } from "../bot";
import type { Bot } from "grammy";

import { start } from "./start";
import { schedule } from "./schedule";
import { today, tomorrow } from "./quick-date";
import { help } from "./help";
import { about } from "./about";
import { clear } from "./clear";
import { menu } from "./menu";
import { clearCache } from "./clear-cache";

const COMMANDS = [start, schedule, today, tomorrow, help, about, clear, menu, clearCache];

export class CommandsRegister {
  public constructor(private readonly bot: Bot<Context>) {}

  public execute() {
    COMMANDS.forEach((command) => {
      return this.bot.command(command.name, command);
    });
  }
}
