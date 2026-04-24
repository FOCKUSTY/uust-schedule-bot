import { createContext, Script } from "vm";
import { Cache } from "../cache";

export class ScheduleUrlsExtractor {
  private cache: Cache;

  public constructor(cache?: Cache) {
    this.cache = cache ?? new Cache("schedule-urls");
  }

  /**
   * Возвращает объект scheduleUrls (из кэша или с сайта)
   */
  public async getScheduleUrls(): Promise<Record<string, string>> {
    return this.cache.use("schedule-urls", async () => {
      const html = await this.fetchHtml();
      const urls = this.extractScheduleUrls(html);
      return urls;
    });
  }

  public async refresh(): Promise<Record<string, string>> {
    await this.cache.delete("schedule-urls");
    return this.getScheduleUrls();
  }

  private async fetchHtml(): Promise<string> {
    const response = await fetch("https://uust.ru/ispo/schedule/");
    if (!response.ok) {
      throw new Error(`Ошибка загрузки страницы: ${response.status}`);
    }

    return response.text();
  }

  private extractScheduleUrls(html: string): Record<string, string> {
    const regex = /(?:const|let|var)\s+scheduleUrls\s*=\s*(\{[\s\S]*?\});/;
    const match = html.match(regex);
    if (!match || !match[1]) {
      throw new Error("Не удалось найти scheduleUrls в HTML");
    }

    const objectString = match[1];
    const sandbox = { result: null };
    const script = new Script(`result = ${objectString}`);
    const context = createContext(sandbox);

    script.runInContext(context);

    const urls = sandbox.result;
    if (typeof urls !== "object" || urls === null) {
      throw new Error("scheduleUrls не является объектом");
    }

    return urls as Record<string, string>;
  }
}
