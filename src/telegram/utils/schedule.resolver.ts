import type { SessionData } from "@/types";
import { WEEKDAY_NAMES } from "@/constants";

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
    offsets: {
      weekOffset: number;
      dayOffset: number;
    };
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
    const week = weekNumber + offsets.weekOffset;
    const length = Object.keys(WEEKDAY_NAMES).length;
    const day = (((dayNumber + offsets.dayOffset) % length) + length) % length;

    return {
      dayNumber: day === 0 ? 7 : day,
      dayOffset: offsets.dayOffset,
      weekNumber: week,
      weekOffset: offsets.weekOffset + Math.trunc(day / length),
    };
  }

  public static getCurrentDay() {
    const date = new Date();
    const day = date.getDay() === 0 ? 7 : date.getDay();
    return day;
  }
}
