import type { SessionData } from "./session";

export const DAY_NAMES_RU = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export const getDayIndexForToday = (): number => {
  const day = new Date().getUTCDay();
  return (day + 6) % 7;
};

const resolveDayOffset = (currentOffset: number) => {
  const length = DAY_NAMES_RU.length;
  const currentIndex = getDayIndexForToday();

  const day = currentIndex + currentOffset;

  return {
    dayIndex: ((day % length) + length) % length,
    weekOffset: Math.trunc(day / length)
  };
};

export const resolveQuickDate = ({
  qiuckDate,
  weekNumber,
  offsets: { dayOffset, weekOffset },
}: {
  qiuckDate: SessionData["quickDate"];
  weekNumber: number;
  offsets: {
    weekOffset: number;
    dayOffset: number;
  };
}) => {
  if (qiuckDate === "tomorrow") {
    return getTomorrow(weekNumber);
  }

  if (qiuckDate === "today") {
    return {
      dayIndex: getDayIndexForToday(),
      weekNumber,
      dayOffset: 0,
    };
  }

  const week = weekNumber + weekOffset;
  const { dayIndex, weekOffset: resolvedWeekOffset } = resolveDayOffset(dayOffset);

  return {
    dayIndex,
    dayOffset: 0,
    weekNumber: week + resolvedWeekOffset,
  };
};

export const getTomorrow = (weekNumber: number) => {
  const {
    dayIndex,
    weekOffset
  } = resolveDayOffset(1);

  return {
    dayIndex: dayIndex,
    dayOffset: 0,
    weekNumber: weekNumber+weekOffset,
  };
};
