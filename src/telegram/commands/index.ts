import { about } from "./about.command";
import { help } from "./help.command";
import { menu } from "./menu.command";
import { today, tomorrow } from "./quick-date.commands";
import { schedule } from "./schedule.command";
import { start } from "./start.command";
import { subgroup } from "./subgroup.command";

export const COMMANDS = [
  start,
  today,
  tomorrow,
  help,
  about,
  menu,
  schedule,
  subgroup,
];

export * from "./quick-date.commands";
export * from "./start.command";
