import { GroupInformation, ScheduleWeek } from "../types";
import { ScheduleFetcher } from "../../uust/fetcher";
import { ScheduleSearch } from "../../uust/search";
import { Cache } from "../../cache";
import { ScheduleProvider } from "../schedule-provider.interface";

export class IsuScheduleProvider implements ScheduleProvider {
  private readonly fetcher: ScheduleFetcher;
  private readonly searcher: ScheduleSearch;
  private readonly cache: Cache;

  constructor() {
    this.fetcher = new ScheduleFetcher();
    this.searcher = new ScheduleSearch();
    this.cache = new Cache("isu-group-ids");
  }

  async getFullSchedule(_group: GroupInformation): Promise<any> {
    throw new Error("getFullSchedule not supported");
  }

  async getWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
    skipCache: boolean,
  ): Promise<ScheduleWeek> {
    const groupId = await this.getGroupId(group.group, skipCache);
    if (!groupId) {
      throw new Error(`Группа "${group.group}" не найдена в ИСУ`);
    }

    const data = await this.fetcher.fetch({
      groupId,
      week: weekNumber + 1,
    });

    const scheduleWeek: ScheduleWeek = {
      weekNumber,
      days: {},
    };

    const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    for (const dayName of dayNames) {
      const items = data.schedule[dayName] || [];
      const pairs: Record<number, string | null> = {};
      items.forEach((item, index) => {
        const pairNumber = index + 1;
        const text = this.buildPairText(item);
        pairs[pairNumber] = text || null;
      });
      scheduleWeek.days[dayName] = { dayName, pairs };
    }

    return scheduleWeek;
  }

  private async getGroupId(
    groupName: string,
    skipCache: boolean,
  ): Promise<number | null> {
    const key = `groupid:${groupName}`;
    const cached = await this.cache.get<number>(key);
    if (cached !== undefined && !skipCache) {
      return cached;
    }

    const results = await this.searcher.searchGroups(groupName);
    const found = results.find((r) => r.name === groupName);
    const id = found ? found.id : (results.length > 0 ? results[0].id : null);
    if (id !== null) {
      await this.cache.set(key, id, 60 * 60 * 1000);
    }
    return id;
  }

  private buildPairText(item: {
    subject: string | null;
    teacher: string | null;
    classroom: string | null;
  }): string {
    const parts = [];
    if (item.subject) parts.push(item.subject);
    if (item.teacher) parts.push(item.teacher);
    if (item.classroom) parts.push(item.classroom);
    return parts.join(" (") + (parts.length > 1 ? ")" : "");
  }
}