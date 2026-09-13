export const WEEKDAY_NAMES: Record<number, string> = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
};

export const WEEKEND = 7;
export const SATURDAY = 6;

export const LESSON_NUMBERS: Record<string, number> = {
  "08:00-09:30": 1,
  "09:40-11:10": 2,
  "12:00-13:30": 3,
  "13:40-15:10": 4,
  "15:50-17:20": 5,
  "17:30-19:00": 6,
  "19:10-20:40": 7,
};

export const DEFAULT_PAIR_TIMES: Record<number, string> = {
  1: "08:00-09:30",
  2: "09:40-11:10",
  3: "12:00-13:30",
  4: "13:40-15:10",
  5: "15:50-17:20",
  6: "17:30-19:00",
  7: "19:10-20:40",
};

export const SATURDAY_PAIR_TIMES: Record<number, string> = {
  1: "08:00-09:30",
  2: "09:40-11:10",
  3: "11:30-13:00",
  4: "13:10-14:40",
  5: "14:50-16:20",
  6: "16:30-18:00",
  7: "18:10-19:40",
};

export const MAX_PAIRS = Math.max(
  ...Object.keys(DEFAULT_PAIR_TIMES).map(Number),
);
