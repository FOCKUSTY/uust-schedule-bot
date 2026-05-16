import type { GroupInformation, ScheduleWeek } from "./types";
import type { ScheduleProvider } from "./schedule-provider.interface";

import { WebsiteScheduleProvider } from "./website-schedule.provider";
import { Cache } from "../cache";
import { CACHE_TTL } from "./constants";

export class ScheduleLoader {
  private readonly cache: Cache;
  private readonly provider: ScheduleProvider;

  public constructor(
    group: string,
    cache?: Cache,
  ) {
    this.cache = cache ?? new Cache(`schedule:loader:${group}`);
    this.provider = new WebsiteScheduleProvider();
  }

  public async loadWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
    skipCache: boolean = true
  ): Promise<ScheduleWeek> {    
    const key = this.buildWeekKey(group, weekNumber);
    return this.cache.use(
      key,
      async () => {
        const week = await this.provider.getWeekSchedule(group, weekNumber, skipCache);
        if (!week) {
          throw new Error(`Неделя ${weekNumber} не найдена в расписании`);
        }

        return week;
      }, {
        ttl: CACHE_TTL.SINGLE_WEEK,
        skip: skipCache
      },
    );
  }

  private buildWeekKey(group: GroupInformation, weekNumber: number): string {
    return `week:${group.course}:${group.specialization}:${group.group}:${weekNumber}`;
  }
}
