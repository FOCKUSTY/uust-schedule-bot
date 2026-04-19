import type { ScheduleDay, ScheduleWeek } from "../../schedule";
import type { WeekCalculator } from "../../schedule";

import { StringBuilder } from "./string-builder";
import { MAX_PAIRS, REGULAR_PAIR_TIMES, SATURDAY_PAIR_TIMES } from "../constants/pairs";

const DAY_NAMES_RU = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

const normalizeDays = (days: ScheduleWeek["days"]): ScheduleWeek["days"] => {
  const normalized: ScheduleWeek["days"] = {};

  for (const [key, value] of Object.entries(days)) {
    const trimmed = key.trim();
    const correctKey = DAY_NAMES_RU.find((day) => day === trimmed) ?? trimmed;
    normalized[correctKey] = value;
  }

  return normalized;
};

const getPairTimes = (dayName: string, pairNumber: number): string | null => {
  const times = dayName === "Суббота" ? SATURDAY_PAIR_TIMES : REGULAR_PAIR_TIMES;
  const pair = times[pairNumber - 1];
  if (!pair) return null;
  return `${pair.start}-${pair.end}`;
};

export const getWeekendText = (
  dayName: string,
  weekNumber: number,
  weekCalculator: WeekCalculator,
): string => {
  const date = weekCalculator.getDateFromWeekNumber(
    weekNumber,
    DAY_NAMES_RU.indexOf(dayName),
  );
  return new StringBuilder()
    .appendLine(`${dayName}, выходной день ${date.toLocaleDateString()} (неделя ${weekNumber})`)
    .appendLine("Пар нет")
    .toString();
};

export const formatDay = (
  day: ScheduleDay,
  weekNumber: number,
  weekCalculator: WeekCalculator,
  groupName?: string,
): string => {
  const date = weekCalculator.getDateFromWeekNumber(
    weekNumber,
    DAY_NAMES_RU.indexOf(day.dayName),
  );

  const builder = new StringBuilder();

  builder.append(`🎩 ${day.dayName}`);
  if (groupName) {
    builder.append(` ${groupName}`);
  }
  builder.append(` на ${date.toLocaleDateString()}:`).appendLine();

  const pairs = day.pairs;
  const pairKeys = Object.keys(pairs)
    .map(Number)
    .sort((a, b) => a - b);

  if (pairKeys.length === 0) {
    return getWeekendText(day.dayName, weekNumber, weekCalculator);
  }

  for (let number = 1; number <= MAX_PAIRS; number++) {
    const timeRange = getPairTimes(day.dayName, number);
    const pairInfo = pairs[number] || null;

    builder.append(`⏰ ${timeRange} (${number} пара)`).appendLine();

    if (pairInfo) {
      builder.quote(`📝 ${pairInfo}`).appendLine();
    } else {
      builder.quote(`❌ Нет пары`).appendLine();
    }
  }

  return builder.toString();
};

export const formatWeek = (
  week: ScheduleWeek,
  weekCalculator: WeekCalculator,
  groupName?: string,
): string => {
  const builder = new StringBuilder();

  const firstDate = weekCalculator.getDateFromWeekNumber(week.weekNumber, 0);
  const lastDate = weekCalculator.getDateFromWeekNumber(week.weekNumber, 5);
  builder
    .bold(`📆 Неделя ${week.weekNumber} (${firstDate.toLocaleDateString()} – ${lastDate.toLocaleDateString()})`)
    .appendLine()
    .appendLine();

  const days = normalizeDays(week.days);

  for (let i = 0; i < DAY_NAMES_RU.length; i++) {
    const dayName = DAY_NAMES_RU[i];
    const day = days[dayName];
    if (!day || dayName === "Воскресенье") continue;

    builder.appendRaw(formatDay(day, week.weekNumber, weekCalculator, groupName));

    if (i < DAY_NAMES_RU.length - 2) {
      builder.appendRawLine().appendRawLine();
    }
  }

  return builder.toString();
};