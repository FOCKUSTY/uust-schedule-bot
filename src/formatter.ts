import type { FormattedSchedule, ScheduleDay, ScheduleWeek } from './types';

const DAY_NAMES = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
] as const;

type DayName = (typeof DAY_NAMES)[number];

/**
 * Класс для форматирования расписания из сырого Excel-массива.
 */
export class ScheduleFormatter {
  /**
   * Преобразует сырой массив в структурированное расписание.
   * @param rawData Двумерный массив строк из Excel
   */
  public format(rawData: string[][]): FormattedSchedule {
    const groupName = this.extractGroupName(rawData);
    const weekNumbers = this.extractWeekNumbers(rawData);
    const weeks = this.buildWeeks(rawData, weekNumbers);

    return {
      groupName,
      weeks,
    };
  }

  private extractGroupName(rawData: string[][]): string {
    const firstRow = rawData[0] || [];
    const groupCell = firstRow[3];
    
    return groupCell || 'Неизвестная группа';
  }

  private extractWeekNumbers(rawData: string[][]): number[] {
    const secondRow = rawData[1] || [];
    const weekNumbers: number[] = [];
    
    for (let col = 3; col < secondRow.length; col++) {
      const value = secondRow[col];
      if (value !== null && value !== undefined && value !== '') {
        weekNumbers.push(Number(value));
      }
    }

    return weekNumbers;
  }

  private buildWeeks(
    rawData: string[][],
    weekNumbers: number[]
  ): Record<number, ScheduleWeek> {
    const weeks: Record<number, ScheduleWeek> = {};
    for (const weekNumber of weekNumbers) {
      weeks[weekNumber] = { weekNumber, days: {} };
    }

    let currentDayName: DayName | null = null;

    for (let row = 2; row < rawData.length; row++) {
      const rowData = rawData[row];
      const firstCell = rowData[0];
      const pairCell = rowData[1];

      if (this.isDayName(firstCell)) {
        currentDayName = firstCell as DayName;
      }

      if (currentDayName === null) {
        continue;
      }

      const pairNumber = this.parsePairNumber(pairCell);
      if (pairNumber === null) {
        continue;
      }

      this.ensureDayExists(weeks, weekNumbers, currentDayName);

      for (let colIndex = 0; colIndex < weekNumbers.length; colIndex++) {
        const weekNumber = weekNumbers[colIndex];
        const cellValue = rowData[colIndex + 3] || null;
        const cleanedValue = this.cleanCellValue(cellValue);
        weeks[weekNumber].days[currentDayName].pairs[pairNumber] = cleanedValue;
      }
    }

    return weeks;
  }

  private isDayName(value: string | null): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return DAY_NAMES.includes(value as DayName);
  }

  private parsePairNumber(value: string | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  private ensureDayExists(
    weeks: Record<number, ScheduleWeek>,
    weekNumbers: number[],
    dayName: DayName
  ): void {
    for (const weekNumber of weekNumbers) {
      if (!weeks[weekNumber].days[dayName]) {
        weeks[weekNumber].days[dayName] = {
          dayName,
          pairs: {},
        };
      }
    }
  }

  private cleanCellValue(value: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}