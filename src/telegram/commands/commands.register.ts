import type { Context } from "../bot";
import type { Bot } from "grammy";

import { start } from "./start";
import { schedule } from "./schedule";
import { today, tomorrow } from "./quick-date";

const COMMANDS = [start, schedule, today, tomorrow];

export class CommandsRegister {
  public constructor(private readonly bot: Bot<Context>) {}

  public execute() {
    COMMANDS.forEach((command) => {
      return this.bot.command(command.name, command);
    });
  }
}
