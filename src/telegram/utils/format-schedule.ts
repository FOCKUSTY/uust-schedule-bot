import { DaySchedule, GroupInformation, Pair, WeekSchedule } from "@/types";
import { StringBuilder } from "./string-builder";
import { DateCalculator } from "./date-calculator";
import {
  DEFAULT_PAIR_TIMES,
  MAX_PAIRS,
  SATURDAY,
  SATURDAY_PAIR_TIMES,
  WEEKDAY_NAMES,
  WEEKEND,
} from "@/constants";

export const toRussianDate = (date: Date) => {
  return date.toLocaleDateString("ru-RU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getNoDataText = ({
  weekNumber,
  dayNumber,
  group,
}: WeekendParameters) => {
  const builder = new StringBuilder();
  const date = new DateCalculator().getDateFromWeekNumberAndDayNumber(
    weekNumber,
    dayNumber,
  );

  builder
    .append(`${group.group} `)
    .appendLine(`🎩 на ${toRussianDate(date)}`)
    .appendLine(`(неделя ${weekNumber})`)
    .quote("⚠️ Не удалось получить расписание. Попробуйте позже.");

  return builder.toString();
};

export type WeekendParameters = {
  weekNumber: number;
  dayNumber: number;
  group: GroupInformation;
};

export const getWeekendText = ({
  weekNumber,
  dayNumber,
  group,
}: WeekendParameters) => {
  const builder = new StringBuilder();

  const date = new DateCalculator().getDateFromWeekNumberAndDayNumber(
    weekNumber,
    dayNumber,
  );
  builder
    .append(`${group.group} `)
    .appendLine(`🎩 на ${toRussianDate(date)}`)
    .appendLine(`Выходной день (неделя ${weekNumber})`)
    .quote("💕 Пар нет");

  return builder.toString();
};

export type DayParameters = WeekendParameters & {
  day: DaySchedule;
};

export const getDayText = ({
  day,
  dayNumber,
  weekNumber,
  group,
}: DayParameters) => {
  const date = new DateCalculator().getDateFromWeekNumberAndDayNumber(
    weekNumber,
    dayNumber,
  );
  const builder = new StringBuilder();
  builder.append(`${group.group} `);
  builder.append(`🎩 на ${toRussianDate(date)}:`).appendLine();

  const pairs = Object.keys(day).map(Number).sort();
  if (pairs.length === 0) {
    return getWeekendText({ weekNumber, dayNumber, group });
  }

  for (let number = 1; number <= MAX_PAIRS; number++) {
    const pair: Pair | undefined = day[number];
    const time =
      dayNumber === SATURDAY
        ? SATURDAY_PAIR_TIMES[number]
        : DEFAULT_PAIR_TIMES[number];

    builder.append(`⏰ ${time} (${number} пара)`).appendLine();
    if (pair) {
      builder
        .quote(
          `📝 ${pair.type} ${pair.title}: ${pair.teacher.name}, ${pair.location}`,
        )
        .appendLine();
    } else {
      builder.quote("❌ Нет пары").appendLine();
    }
  }

  return builder.toString();
};

export type WeekParameters = Omit<WeekendParameters, "dayNumber"> & {
  week: WeekSchedule;
};

export const getWeekText = ({ week, group, weekNumber }: WeekParameters) => {
  const builder = new StringBuilder();

  const calculator = new DateCalculator();
  const firstDate = calculator.getDateFromWeekNumberAndDayNumber(weekNumber, 1);
  const lastDate = calculator.getDateFromWeekNumberAndDayNumber(weekNumber, 6);

  builder
    .bold(
      `📆 Неделя ${weekNumber} (${toRussianDate(firstDate)} – ${toRussianDate(lastDate)})`,
    )
    .appendLine()
    .appendLine();

  const daysLength = Object.keys(WEEKDAY_NAMES).length;
  for (let dayNumber = 1; dayNumber <= daysLength; dayNumber++) {
    const day = week[dayNumber];
    if (!day || dayNumber === WEEKEND) {
      continue;
    }

    builder.appendRaw(
      getDayText({
        day,
        dayNumber,
        group,
        weekNumber,
      }),
    );

    if (dayNumber <= daysLength - 2) {
      builder.appendRawLine().appendRawLine();
    }
  }

  return builder.toString();
};
