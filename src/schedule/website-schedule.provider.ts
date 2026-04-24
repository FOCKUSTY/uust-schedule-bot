import { GroupInformation, ScheduleWeek, ScheduleWeeks } from "./types";
import { ScheduleProvider } from "./schedule-provider.interface";
import { ScheduleUrlsExtractor } from "./schedule-urls-extractor";
import { read, utils } from "xlsx";

const DAYS_OF_WEEK = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
] as const;

const MAX_WEEK_NUMBER = 44;
const MIN_WEEK_NUMBER = 1;
const SINGLE_LETTER_WEEK_LIMIT = 25;
const PAIRS_PER_DAY = 6;
const DAYS_COUNT = 6;
const CSV_COLUMN_INDEX = 0;
const FIRST_CHAR_CODE_A = 64;

export class WebsiteScheduleProvider implements ScheduleProvider {
  private readonly urlExtractor: ScheduleUrlsExtractor;
  private cachedUrls: Record<string, string> | null = null;

  public constructor(urlExtractor?: ScheduleUrlsExtractor) {
    this.urlExtractor = urlExtractor ?? new ScheduleUrlsExtractor();
  }

  public async getFullSchedule(
    _group: GroupInformation,
  ): Promise<ScheduleWeeks> {
    throw new Error(
      `getFullSchedule is not supported for ${WebsiteScheduleProvider.name}`,
    );
  }

  public async getWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
  ): Promise<ScheduleWeek> {
    const scheduleUrls = await this.getScheduleUrls();
    const baseUrl = scheduleUrls[group.group];
    if (!baseUrl) {
      throw new Error(`URL for group ${group.group} not found`);
    }

    const requestedWeek = weekNumber + 1;
    this.validateWeekNumber(requestedWeek);

    const columnLetter = this.convertWeekNumberToColumnLetter(requestedWeek);
    const csvUrl = `${baseUrl}&range=${columnLetter}3:${columnLetter}38`;

    const csvText = await this.fetchCsv(csvUrl);
    const parsedRows = this.parseCsv(csvText);
    const scheduleWeek = this.convertRowsToScheduleWeek(parsedRows, weekNumber);

    return scheduleWeek;
  }

  private async getScheduleUrls(): Promise<Record<string, string>> {
    if (this.cachedUrls !== null) {
      return this.cachedUrls;
    }

    const urls = await this.urlExtractor.getScheduleUrls();
    this.cachedUrls = urls;

    return urls;
  }

  private validateWeekNumber(weekNumber: number): void {
    if (weekNumber < MIN_WEEK_NUMBER || weekNumber > MAX_WEEK_NUMBER) {
      throw new Error(
        `Week number must be between ${MIN_WEEK_NUMBER} and ${MAX_WEEK_NUMBER}`,
      );
    }
  }

  private convertWeekNumberToColumnLetter(weekNumber: number): string {
    if (weekNumber <= SINGLE_LETTER_WEEK_LIMIT) {
      const charCode = FIRST_CHAR_CODE_A + weekNumber + 1;
      return String.fromCharCode(charCode);
    }

    const firstLetter = "A";
    const secondLetterCode =
      FIRST_CHAR_CODE_A + (weekNumber - SINGLE_LETTER_WEEK_LIMIT);
    const secondLetter = String.fromCharCode(secondLetterCode);

    return firstLetter + secondLetter;
  }

  private async fetchCsv(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }

    return response.text();
  }

  private parseCsv(csvText: string): string[][] {
    const workbook = read(csvText, { type: "string", raw: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
    return data as string[][];
  }

  private convertRowsToScheduleWeek(
    rows: string[][],
    weekNumber: number,
  ): ScheduleWeek {
    const scheduleWeek: ScheduleWeek = { weekNumber, days: {} };

    for (let dayIndex = 0; dayIndex < DAYS_COUNT; dayIndex++) {
      const dayName = DAYS_OF_WEEK[dayIndex];
      scheduleWeek.days[dayName] = { dayName, pairs: {} };

      for (let pairIndex = 0; pairIndex < PAIRS_PER_DAY; pairIndex++) {
        const rowIndex = dayIndex * PAIRS_PER_DAY + pairIndex;
        const row = rows[rowIndex];

        if (!row) {
          continue;
        }

        const rawCellValue = row[CSV_COLUMN_INDEX];
        const cellValue = rawCellValue?.trim() ?? null;

        if (cellValue !== null) {
          const pairNumber = pairIndex + 1;
          scheduleWeek.days[dayName].pairs[pairNumber] = cellValue;
        }
      }
    }

    return scheduleWeek;
  }
}
