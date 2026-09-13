import { GroupInformation } from "@/types";
import { StringBuilder } from "./string-builder";
import { DateCalculator } from "./date-calculator";

export const toRussianDate = (date: Date) => {
  return date.toLocaleDateString("ru-RU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
