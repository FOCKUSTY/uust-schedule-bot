import { env } from "../env";

import type { GroupInformation, ScheduleWeek } from "./types";
import type { ScheduleProvider } from "./schedule-provider.interface";

import { extractIdFromUrl } from "./google";
import { GoogleDriveService } from "./google-drive.service";

import { ScheduleLoader } from "./schedule-loader";
import { WeekCalculator } from "./week-calculator";
import { ScheduleCache } from "../cache/schedule-cache";
import { WebsiteScheduleProvider } from "./website-schedule.provider";

export class Schedule {
  private readonly provider: ScheduleProvider;
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
      provider?: ScheduleProvider
    },
  ) {
    const rootFolderId = extractIdFromUrl(env.GOOGLE_DRIVE_FOLDER_URL);
    if (!rootFolderId) {
      throw new Error("Invalid GOOGLE_DRIVE_FOLDER_URL");
    }

    const driveService = new GoogleDriveService(rootFolderId);
    this.loader = deps?.loader ?? new ScheduleLoader(driveService, group.group);
    this.cache = deps?.cache ?? new ScheduleCache(group.group);
    this.weekCalculator =
      deps?.weekCalculator ?? new WeekCalculator(env.START_DATE);
    this.provider = deps?.provider ?? new WebsiteScheduleProvider();
  }

  public async initializeCache(): Promise<void> {
    await this.cache.loadAll();
  }

  public async getWeekSchedule(): Promise<ScheduleWeek> {
    return this.cache.weeksCache.use(
      this.cache.buildWeeksKey(this.group),
      async () => {
        return this.provider.getWeekSchedule(this.group, this.weekNumber);
      },
    );
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
