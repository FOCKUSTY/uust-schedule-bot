import type { Context } from "../bot";
import type { Bot } from "grammy";

import { start } from "./start";
import { schedule } from "./schedule";

const COMMANDS = [
  start,
  schedule
]

export class CommandsRegister {
  public constructor(
    private readonly bot: Bot<Context>
  ) {}

  public execute() {
    COMMANDS.forEach((command) => {
      return this.bot.command(command.name, command);
    });
  }
}