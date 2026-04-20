import type { DateLike } from "./types";

/**
 * Класс для вычисления номера учебной недели и дат.
 * Все операции выполняются в UTC.
 */
export class WeekCalculator {
  private readonly startDateUTC: Date; // хранит момент времени, соответствующий началу дня (00:00 UTC)

  /**
   * @param startDate Дата начала первого учебного дня (обычно START_DATE из .env)
   *                 Ожидается, что это UTC-дата (строка с Z или объект Date).
   *                 Будет приведена к UTC-полночь.
   */
  public constructor(startDate: Date) {
    this.startDateUTC = this.normalizeToUTCMidnight(startDate);
  }

  /**
   * Возвращает номер текущей учебной недели относительно даты старта.
   * @param targetDate Дата, для которой вычисляется неделя (по умолчанию сегодня)
   */
  public getCurrentWeek(targetDate: DateLike = new Date()): number {
    const targetUTC = this.normalizeToUTCMidnight(targetDate);
    const start = this.startDateUTC;

    if (targetUTC < start) {
      return 0;
    }

    const diffMs = targetUTC.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.floor(days / 7);
  }

  /**
   * Возвращает объект Date для указанного дня недели внутри учебной недели.
   * @param weekNumber Номер учебной недели (0-based)
   * @param dayIndex Индекс дня недели (0 = Понедельник, 6 = Воскресенье)
   * @returns Date в UTC с временем 00:00:00.000Z
   */
  public getDateFromWeekNumber(weekNumber: number, dayIndex: number = 0): Date {
    const baseUTC = new Date(this.startDateUTC);
    baseUTC.setUTCDate(baseUTC.getUTCDate() + weekNumber * 7);

    const baseDayOfWeek = baseUTC.getUTCDay();
    const baseMondayIndex = (baseDayOfWeek === 0 ? 6 : baseDayOfWeek - 1);
    
    const offset = dayIndex - baseMondayIndex;
    baseUTC.setUTCDate(baseUTC.getUTCDate() + offset);
    baseUTC.setUTCHours(0, 0, 0, 0);
    
    return baseUTC;
  }

  /**
   * Приводит переданную дату к UTC-полночи (00:00:00.000Z).
   * Если передан объект Date с ненулевым временем, оно отбрасывается.
   */
  private normalizeToUTCMidnight(date: DateLike): Date {
    const d = new Date(date);
    
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();

    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
}