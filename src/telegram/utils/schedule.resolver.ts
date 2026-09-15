import type { SessionData } from "@/types";
import { DAYS_PER_WEEK } from "@/constants";

export class ScheduleResolver {
  public static resolveQuickDate({
    quickDate,
    weekNumber,
    dayNumber,
    offsets,
  }: {
    quickDate: SessionData["quickDate"];
    weekNumber: number;
    dayNumber: number;
    offsets: { weekOffset: number; dayOffset: number };
  }): {
    dayNumber: number;
    weekNumber: number;
    dayOffset: number;
    weekOffset: number;
  } {
    if (quickDate === "tomorrow") {
      return this.resolveTomorrow(weekNumber);
    }

    if (quickDate === "today") {
      return this.resolveToday(weekNumber);
    }

    return this.resolveDayOffset(weekNumber, dayNumber, offsets);
  }

  public static resolveToday(weekNumber: number) {
    const today = this.getCurrentDay();
    return this.resolveDayOffset(weekNumber, today, {
      dayOffset: 0,
      weekOffset: 0,
    });
  }

  public static resolveTomorrow(weekNumber: number) {
    const today = this.getCurrentDay();
    return this.resolveDayOffset(weekNumber, today, {
      dayOffset: 1,
      weekOffset: 0,
    });
  }

  public static resolveDayOffset(
    weekNumber: number,
    dayNumber: number,
    offsets: { weekOffset: number; dayOffset: number },
  ): {
    dayNumber: number;
    dayOffset: number;
    weekNumber: number;
    weekOffset: number;
  } {
    const raw = dayNumber - 1 + offsets.dayOffset;
    const weekDelta = Math.floor(raw / DAYS_PER_WEEK);
    const normalizedDay =
      (((raw % DAYS_PER_WEEK) + DAYS_PER_WEEK) % DAYS_PER_WEEK) + 1;

    return {
      dayNumber: normalizedDay,
      dayOffset: offsets.dayOffset,
      weekNumber: weekNumber + offsets.weekOffset + weekDelta,
      weekOffset: offsets.weekOffset + weekDelta,
    };
  }

  public static getCurrentDay() {
    const date = new Date();
    const day = date.getDay() === 0 ? 7 : date.getDay();
    return day;
  }
}
