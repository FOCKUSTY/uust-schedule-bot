import type { DateLike } from "./types";

/**
 * Класс для вычисления номера учебной недели и дат.
 */
export class WeekCalculator {
  private readonly startDate: Date;

  /**
   * @param startDate Дата начала первого учебного дня (обычно START_DATE из .env)
   */
  public constructor(startDate: Date) {
    this.startDate = this.normalizeDate(startDate);
  }

  /**
   * Возвращает номер текущей учебной недели относительно даты старта.
   * @param targetDate Дата, для которой вычисляется неделя (по умолчанию сегодня)
   */
  public getCurrentWeek(targetDate: DateLike = new Date()): number {
    const target = this.normalizeDate(targetDate);
    const start = this.startDate;

    if (target < start) {
      return 0;
    }

    const diffMs = target.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.floor(days / 7);
  }

  /**
   * Возвращает объект Date для указанного дня недели внутри учебной недели.
   * @param weekNumber Номер учебной недели (0-based)
   * @param dayIndex Индекс дня недели (0 = Понедельник, 6 = Воскресенье)
   */
  public getDateFromWeekNumber(weekNumber: number, dayIndex: number = 0): Date {
    const baseDate = new Date(this.startDate);
    baseDate.setDate(baseDate.getDate() + weekNumber * 7);

    const startDayOfWeek = (baseDate.getDay() + 6) % 7;
    baseDate.setDate(baseDate.getDate() - startDayOfWeek + dayIndex);
    baseDate.setHours(0, 0, 0, 0);
    return baseDate;
  }

  private normalizeDate(date: DateLike): Date {
    const normilizedDate = new Date(date);
    normilizedDate.setHours(0, 0, 0, 0);
    return normilizedDate;
  }
}