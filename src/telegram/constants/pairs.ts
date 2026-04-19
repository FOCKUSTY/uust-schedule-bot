export const MAX_PAIRS = 6;

/**
 * Временные интервалы для пар в обычные дни (пн–пт)
 */
export const REGULAR_PAIR_TIMES = [
  { start: "8:00", end: "9:30" },
  { start: "9:40", end: "11:10" },
  { start: "12:00", end: "13:30" },
  { start: "13:40", end: "15:10" },
  { start: "15:50", end: "17:20" },
  { start: "17:30", end: "19:00" },
] as const;

/**
 * Временные интервалы для пар в субботу (сокращённый день)
 */
export const SATURDAY_PAIR_TIMES = [
  { start: "8:00", end: "9:30" },
  { start: "9:40", end: "11:10" },
  { start: "11:30", end: "13:00" },
  { start: "13:10", end: "14:40" },
  { start: "14:50", end: "16:20" },
  { start: "16:30", end: "18:00" },
] as const;

export type PairTimes = typeof REGULAR_PAIR_TIMES;