import type { ScheduleDay, ScheduleWeek } from "../../schedule";
import type { WeekCalculator } from "../../schedule";

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

export const getWeekendText = (
  dayName: string,
  weekNumber: number,
  weekCalculator: WeekCalculator,
): string => {
  const date = weekCalculator.getDateFromWeekNumber(
    weekNumber,
    DAY_NAMES_RU.indexOf(dayName),
  );
  return `${dayName}, выходной день ${date.toLocaleDateString()} (неделя ${weekNumber})\nПар нет`;
};

export const formatDay = (
  day: ScheduleDay,
  weekNumber: number,
  weekCalculator: WeekCalculator,
): string => {
  const date = weekCalculator.getDateFromWeekNumber(
    weekNumber,
    DAY_NAMES_RU.indexOf(day.dayName),
  );
  let text = `📅 ${day.dayName} ${date.toLocaleDateString()} (неделя ${weekNumber})\n`;

  const pairs = day.pairs;
  const pairKeys = Object.keys(pairs)
    .map(Number)
    .sort((a, b) => a - b);

  if (pairKeys.length === 0) {
    return getWeekendText(day.dayName, weekNumber, weekCalculator);
  }

  for (const num of pairKeys) {
    const pairInfo = pairs[num] || "—";
    text += `${num}. ${pairInfo}\n`;
  }

  return text;
};

export const formatWeek = (
  week: ScheduleWeek,
  weekCalculator: WeekCalculator,
): string => {
  let text = `📆 Расписание на неделю`;
  const days = normalizeDays(week.days);

  for (const dayName of DAY_NAMES_RU) {
    const day = days[dayName];
    if (day) {
      text += formatDay(day, week.weekNumber, weekCalculator) + "\n\n";
    }
  }

  return text;
};
