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
import {
  shortenLessonType,
  shortenLocation,
  shortenTeacher,
} from "@/utils/text-formatter";

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
  preferredSubgroup?: string | null;
  shorten?: boolean;
};

export const getDayText = ({
  day,
  dayNumber,
  weekNumber,
  group,
  preferredSubgroup,
  shorten = false,
}: DayParameters) => {
  const date = new DateCalculator().getDateFromWeekNumberAndDayNumber(
    weekNumber,
    dayNumber,
  );
  const builder = new StringBuilder();
  builder.append(`${group.group} `);
  builder.append(`🎩 на ${toRussianDate(date)}:`).appendLine();

  const pairsKeys = Object.keys(day).map(Number).sort();
  if (pairsKeys.length === 0) {
    return getWeekendText({ weekNumber, dayNumber, group });
  }

  for (let number = 1; number <= MAX_PAIRS; number++) {
    const pairs: Pair[] | undefined = day[number];

    if (!pairs || pairs.length === 0) continue;

    const time =
      dayNumber === SATURDAY
        ? SATURDAY_PAIR_TIMES[number]
        : DEFAULT_PAIR_TIMES[number];

    builder.append(`⏰ ${time} (${number} пара)`).appendLine();

    const prefNum = parseInt(preferredSubgroup || "0", 10);
    const sortedPairs = [...pairs].sort((a, b) => {
      const aNum = parseInt(a.subgroup || "0", 10);
      const bNum = parseInt(b.subgroup || "0", 10);
      if (aNum === prefNum && bNum !== prefNum) return -1;
      if (bNum === prefNum && aNum !== prefNum) return 1;
      return aNum - bNum;
    });

    sortedPairs.forEach((pair) => {
      const title = shorten ? shortenLessonType(pair.title) : pair.title;
      const tName = pair.teacher.name
        ? shorten
          ? shortenTeacher(pair.teacher.name)
          : pair.teacher.name
        : "";
      const teacherName = tName ? `: ${tName}` : "";
      const location =
        pair.location === "Уточняется"
          ? "Уточняется"
          : shorten
            ? shortenLocation(pair.location)
            : pair.location;
      const locationText = location ? `, ${location}` : "";

      const subgroup = pair.subgroup ? `${pair.subgroup} ` : "";

      builder
        .quote(`📝 ${subgroup}${title}${teacherName}${locationText}`)
        .appendLine();
    });
  }

  return builder.toString();
};

export type WeekParameters = Omit<WeekendParameters, "dayNumber"> & {
  week: WeekSchedule;
  preferredSubgroup?: string | null;
  shorten?: boolean;
};

export const getWeekText = ({
  week,
  group,
  weekNumber,
  preferredSubgroup,
  shorten = true,
}: WeekParameters) => {
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
        preferredSubgroup,
        shorten,
      }),
    );

    if (dayNumber <= daysLength - 2) {
      builder.appendRawLine().appendRawLine();
    }
  }

  return builder.toString();
};
