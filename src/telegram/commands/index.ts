import { today, tomorrow } from "./quick-date.commands";
import { start } from "./start.command";

export const COMMANDS = [start, today, tomorrow];

export * from "./quick-date.commands";
export * from "./start.command";
