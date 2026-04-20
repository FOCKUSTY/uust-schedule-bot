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

export const resolveDayOffset = (currentOffset: number): number => {
  const length = DAY_NAMES_RU.length;
  const currentIndex = getDayIndexForToday();

  return (((currentIndex + currentOffset) % length) + length) % length;
};

export const resolveQuickDate = ({
  qiuckDate,
  weekNumber,
  offsets: {
    dayOffset,
    weekOffset
  }
}: {
  qiuckDate: SessionData["quickDate"],
  weekNumber: number,
  offsets: {
    weekOffset: number,
    dayOffset: number
  }
}) => {
  if (qiuckDate === "tomorrow") {
    return getTomorrow(weekNumber);
  }

  if (qiuckDate === "today") {
    return {
      dayIndex: getDayIndexForToday(),
      weekNumber,
      dayOffset: 0,
    }
  }

  const week = weekNumber + weekOffset;
  const dayIndex = resolveDayOffset(dayOffset);

  return {
    dayIndex,
    dayOffset: 0,
    weekNumber: week,
  }
}

export const getTomorrow = (weekNumber: number) => {
  const currentIndex = getDayIndexForToday();
  if (DAY_NAMES_RU[currentIndex] === "Воскресенье") {
    return {
      dayIndex: 0,
      weekNumber: weekNumber+1,
      dayOffset: 0,
    }
  }

  return {
    dayIndex: currentIndex+1,
    dayOffset: 1,
    weekNumber
  };
}