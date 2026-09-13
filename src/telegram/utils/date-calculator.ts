import { env } from "@/env";

export type DateLike = Date | string | number;

export class DateCalculator {
  private readonly startDateUtc: Date;

  public constructor() {
    this.startDateUtc = this.normalizeToUTCMidnight(env.START_DATE);
  }

  public getDateFromWeekNumberAndDayNumber(
    weekNumber: number,
    dayNumber: number,
  ): Date {
    const baseUTC = new Date(this.startDateUtc);
    baseUTC.setUTCDate(baseUTC.getUTCDate() + weekNumber * 7);

    const baseDayOfWeek = baseUTC.getUTCDay();
    const baseMondayIndex = baseDayOfWeek === 0 ? 6 : baseDayOfWeek - 1;

    const offset = dayNumber - 1 - baseMondayIndex;
    baseUTC.setUTCDate(baseUTC.getUTCDate() + offset);
    baseUTC.setUTCHours(0, 0, 0, 0);

    return baseUTC;
  }

  private normalizeToUTCMidnight(date: DateLike): Date {
    const d = new Date(date);

    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();

    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
}
