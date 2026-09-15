import { DAYS_PER_WEEK, MS_PER_DAY, SUNDAY_INDEX } from "@/constants";
import { env } from "@/env";

export type DateLike = Date | string | number;

export class DateCalculator {
  private readonly startDateUtc: Date;

  public constructor() {
    this.startDateUtc = this.normalizeToUTCMidnight(env.START_DATE);
  }

  public getCurrentWeek() {
    const now = this.normalizeToUTCMidnight(new Date());
    const time = now.getTime() - this.startDateUtc.getTime();
    const days = Math.floor(time / MS_PER_DAY);
    return Math.floor(days / DAYS_PER_WEEK);
  }

  public getDateFromWeekNumberAndDayNumber(
    weekNumber: number,
    dayNumber: number,
  ): Date {
    const baseUtc = new Date(this.startDateUtc);
    baseUtc.setUTCDate(baseUtc.getUTCDate() + weekNumber * 7);

    const baseDayOfWeek = baseUtc.getUTCDay();
    const baseMondayIndex =
      baseDayOfWeek === SUNDAY_INDEX ? DAYS_PER_WEEK - 1 : baseDayOfWeek - 1;

    const offset = dayNumber - 1 - baseMondayIndex;
    baseUtc.setUTCDate(baseUtc.getUTCDate() + offset);
    baseUtc.setUTCHours(0, 0, 0, 0);

    return baseUtc;
  }

  private normalizeToUTCMidnight(date: DateLike): Date {
    const d = new Date(date);

    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();

    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
}
