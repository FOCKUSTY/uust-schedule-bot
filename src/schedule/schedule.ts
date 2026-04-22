import { env } from "../env";

import type { GroupInformation, ScheduleWeek } from "./types";

import { extractIdFromUrl } from "./google";
import { GoogleDriveService } from "./google-drive.service";

import { ScheduleLoader } from "./schedule-loader";
import { WeekCalculator } from "./week-calculator";
import { ScheduleCache } from "../cache/schedule-cache";

export class Schedule {
  public readonly loader: ScheduleLoader;
  public readonly cache: ScheduleCache;
  public readonly weekCalculator: WeekCalculator;

  public constructor(
    public readonly group: GroupInformation,
    public readonly weekNumber: number,
    deps?: {
      loader?: ScheduleLoader;
      cache?: ScheduleCache;
      weekCalculator?: WeekCalculator;
    },
  ) {
    const rootFolderId = extractIdFromUrl(env.GOOGLE_DRIVE_FOLDER_URL);
    if (!rootFolderId) {
      throw new Error("Invalid GOOGLE_DRIVE_FOLDER_URL");
    }

    const driveService = new GoogleDriveService(rootFolderId);
    this.loader = deps?.loader ?? new ScheduleLoader(driveService);
    this.cache = deps?.cache ?? new ScheduleCache();
    this.weekCalculator =
      deps?.weekCalculator ?? new WeekCalculator(env.START_DATE);
  }

  public async initializeCache(): Promise<void> {
    await this.cache.loadAll();
  }

  public async getWeekSchedule(): Promise<ScheduleWeek> {
    return this.cache.weeksCache.use(this.cache.buildWeeksKey(this.group), async () => {
      const weeks = await this.loader.loadFullSchedule(this.group);
      const week = weeks[this.weekNumber];
      if (!week) {
        throw new Error(`Неделя ${this.weekNumber} отсутствует в расписании`);
      }

      await this.cache.saveAll();

      return week;
    });
  }

  public withWeek(newWeek: number): Schedule {
    return new Schedule(this.group, newWeek, {
      loader: this.loader,
      cache: this.cache,
      weekCalculator: this.weekCalculator,
    });
  }

  public withGroup(newGroup: GroupInformation): Schedule {
    return new Schedule(newGroup, this.weekNumber, {
      loader: this.loader,
      cache: this.cache,
      weekCalculator: this.weekCalculator,
    });
  }

  public getCache(): ScheduleCache {
    return this.cache;
  }

  public getLoader(): ScheduleLoader {
    return this.loader;
  }

  public getWeekCalculator(): WeekCalculator {
    return this.weekCalculator;
  }
}
