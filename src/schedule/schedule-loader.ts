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
    this.cache = cache ?? new Cache("schedule:loader");
  }

  public async loadFullSchedule(
    group: GroupInformation,
  ): Promise<ScheduleWeeks> {
    const key = this.buildWeeksKey(group);
    return this.cache.use(key, async () => {
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
      return weeks;
    }, CACHE_TTL.WEEKS);
  }

  public async loadWeekSchedule(
    group: GroupInformation,
    weekNumber: number,
  ): Promise<ScheduleWeek> {
    const key = this.buildWeekKey(group, weekNumber);
    return this.cache.use(key, async () => {
      const weeks = await this.loadFullSchedule(group);
      const week = weeks[weekNumber];
      if (!week) {
        throw new Error(`Неделя ${weekNumber} не найдена в расписании`);
      }

      return week;
    }, CACHE_TTL.SINGLE_WEEK);
  }

  private buildWeeksKey(group: GroupInformation): string {
    return `weeks:${group.course}:${group.specialization}:${group.group}`;
  }

  private buildWeekKey(group: GroupInformation, weekNumber: number): string {
    return `week:${group.course}:${group.specialization}:${group.group}:${weekNumber}`;
  }
}
