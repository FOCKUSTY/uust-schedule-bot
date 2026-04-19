import type { GroupInformation, ScheduleWeek, ScheduleWeeks } from "./types";

import { GoogleDriveService } from "./google-drive.service";
import { ScheduleFormatter } from "./formatter";
import { Cache } from "../cache";
import { CACHE_TTL } from "./constants";

export class ScheduleLoader {
  private readonly cache: Cache;

  public constructor(
    private readonly driveService: GoogleDriveService,
    private readonly formatter: ScheduleFormatter = new ScheduleFormatter(),
    cache?: Cache,
  ) {
    this.cache = cache ?? new Cache("loader", "schedule");
  }

  public async loadFullSchedule(
    group: GroupInformation,
  ): Promise<ScheduleWeeks> {
    const cacheKey = this.buildWeeksKey(group);
    const cached = await this.cache.get<ScheduleWeeks>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const workbook = await this.driveService.loadWorkbook(
      group.course,
      group.specialization,
    );
    const dimensions = workbook.getSheetDimensions(group.group);
    const rawData = workbook.getSheetDataByRange(group.group, {
      startRow: 1,
      startColumn: 1,
      endRow: dimensions.endRow + 1,
      endColumn: dimensions.endCol + 1,
    });

    const { weeks } = this.formatter.format(rawData);
    await this.cache.set(cacheKey, weeks, CACHE_TTL.WEEKS);
    return weeks;
  }

  public async loadWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
  ): Promise<ScheduleWeek> {
    const weekCacheKey = this.buildWeekKey(group, weekNumber);
    const cachedWeek = await this.cache.get<ScheduleWeek>(weekCacheKey);
    if (cachedWeek !== undefined) {
      return cachedWeek;
    }

    const weeks = await this.loadFullSchedule(group);
    const week = weeks[weekNumber];
    if (!week) {
      throw new Error(`Неделя ${weekNumber} не найдена в расписании`);
    }

    await this.cache.set(weekCacheKey, week, CACHE_TTL.SINGLE_WEEK);
    return week;
  }

  private buildWeeksKey(group: GroupInformation): string {
    return `weeks:${group.course}:${group.specialization}:${group.group}`;
  }

  private buildWeekKey(group: GroupInformation, weekNumber: number): string {
    return `week:${group.course}:${group.specialization}:${group.group}:${weekNumber}`;
  }
}
