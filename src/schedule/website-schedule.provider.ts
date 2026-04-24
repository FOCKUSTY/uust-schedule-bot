import { GroupInformation, ScheduleWeek, ScheduleWeeks } from "./types";
import { ScheduleProvider } from "./schedule-provider.interface";
import { ScheduleUrlsExtractor } from "./schedule-urls-extractor";

export class WebsiteScheduleProvider implements ScheduleProvider {
  public constructor(private urls?: Record<string, string>) {}

  public async getFullSchedule(
    group: GroupInformation,
  ): Promise<ScheduleWeeks> {
    const urls = await this.loadUrls();
    const baseUrl = urls[group.group];
    if (!baseUrl) {
      throw new Error(`URL для группы ${group.group} не найден`);
    }

    throw new Error(
      "getFullSchedule не поддерживается для WebsiteScheduleProvider",
    );
  }

  public async getWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
  ): Promise<ScheduleWeek> {
    const urls = await this.loadUrls();
    const baseUrl = urls[group.group];
    if (!baseUrl) {
      throw new Error(`URL для группы ${group.group} не найден`);
    }

    const columnLetter = this.getColumnLetter(weekNumber + 1);
    const url = `${baseUrl}&range=${columnLetter}3:${columnLetter}38`;

    const response = await fetch(url);
    const csvText = await response.text();
    const rows = this.parseCSV(csvText);

    return this.convertToScheduleWeek(rows, weekNumber);
  }

  private getColumnLetter(weekNum: number): string {
    if (weekNum < 1 || weekNum > 44) {
      throw new Error("Неделя вне диапазона 1..44");
    }

    if (weekNum <= 25) {
      return String.fromCharCode(64 + weekNum + 1);
    }

    const first = "A";
    const second = String.fromCharCode(64 + (weekNum - 25));

    return first + second;
  }

  private parseCSV(csvText: string): string[][] {
    const rows = [];
    let currentRow = [];
    let currentValue = "";
    let inQuotes = false;
    let i = 0;

    while (i < csvText.length) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"' && !inQuotes) {
        // Начало quoted значения
        inQuotes = true;
      } else if (char === '"' && nextChar === '"') {
        // Экранированные кавычки внутри quoted значения
        currentValue += '"';
        i++; // Пропускаем следующую кавычку
      } else if (char === '"' && inQuotes) {
        // Конец quoted значения
        inQuotes = false;
      } else if (char === "," && !inQuotes) {
        // Разделитель вне кавычек
        currentRow.push(currentValue);
        currentValue = "";
      } else if (
        (char === "\n" || (char === "\r" && nextChar === "\n")) &&
        !inQuotes
      ) {
        // Конец строки вне кавычек
        if (char === "\r") {
          i++; // Пропускаем \n
        }
        currentRow.push(currentValue);
        rows.push(currentRow);
        currentRow = [];
        currentValue = "";
      } else {
        // Обычный символ
        currentValue += char;
      }
      i++;
    }

    // Добавляем последнее значение и строку, если они есть
    if (currentValue !== "" || currentRow.length > 0) {
      currentRow.push(currentValue);
      rows.push(currentRow);
    }

    return rows;
  }

  private convertToScheduleWeek(
    rows: string[][],
    weekNumber: number,
  ): ScheduleWeek {
    const days = [
      "Понедельник",
      "Вторник",
      "Среда",
      "Четверг",
      "Пятница",
      "Суббота",
    ];
    const scheduleWeek: ScheduleWeek = { weekNumber, days: {} };

    for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
      const dayName = days[dayIdx];
      scheduleWeek.days[dayName] = { dayName, pairs: {} };
      for (let pairIdx = 0; pairIdx < 6; pairIdx++) {
        const row = rows[dayIdx * 6 + pairIdx];
        const cellValue = row?.[0]?.trim() || null;
        if (cellValue) {
          scheduleWeek.days[dayName].pairs[pairIdx + 1] = cellValue;
        }
      }
    }

    return scheduleWeek;
  }

  private async loadUrls() {
    if (this.urls) {
      return this.urls;
    }

    const urls = await new ScheduleUrlsExtractor().getScheduleUrls();
    this.urls = urls;
    return urls;
  }
}
