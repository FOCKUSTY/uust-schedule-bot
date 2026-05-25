import type {
  GroupInformation,
  ScheduleWeeks,
  WatcherData,
} from "../schedule/types";

import { Cache } from "./cache";
import { CACHE_FILE_NAME, TWO_HOURS_MS } from "./constants";
import { ONE_DAY_MS } from "../schedule";

const ONE_WEEK_MS = ONE_DAY_MS * 7;

export class ScheduleCache {
  private static readonly GROUPS_CACHE = new Cache(
    `${CACHE_FILE_NAME}:watcher:groups`,
  );

  public static updateGlobalGroupInfo(
    group: GroupInformation | "global",
    enabled: boolean = true,
  ) {
    if (group === "global") {
      return null;
    }

    return this.GROUPS_CACHE.set(
      group.group,
      {
        enabled,
        group,
      },
      ONE_WEEK_MS,
    );
  }

  public static getGlobalGroupsCache() {
    return this.GROUPS_CACHE;
  }

  public readonly weeksCache: Cache;
  public readonly watcherCache: Cache;

  public constructor(group: string) {
    this.weeksCache = new Cache(`${CACHE_FILE_NAME}:weeks:${group}`);
    this.watcherCache = new Cache(`${CACHE_FILE_NAME}:watсher:${group}`);
  }

  public async loadAll(): Promise<void> {
    await Promise.all([this.weeksCache.load(), this.watcherCache.load()]);
  }

  public async saveAll(): Promise<void> {
    await Promise.all([this.weeksCache.save(), this.watcherCache.save()]);
  }

  public stopAutoSave(): void {
    this.weeksCache.stopAutoSave();
    this.watcherCache.stopAutoSave();
  }

  public async getWeeks(
    group: GroupInformation,
  ): Promise<ScheduleWeeks | undefined> {
    const key = this.buildWeeksKey(group);
    await this.updateGlobalCacheInfo(group);
    return this.weeksCache.get<ScheduleWeeks>(key);
  }

  public async setWeeks(
    group: GroupInformation,
    weeks: ScheduleWeeks,
    ttlMs: number = TWO_HOURS_MS,
  ): Promise<void> {
    const key = this.buildWeeksKey(group);
    await this.updateGlobalCacheInfo(group);
    await this.weeksCache.set(key, weeks, ttlMs);
  }

  public buildWeeksKey(group: GroupInformation): string {
    return `${group.course}:${group.specialization}:${group.group}`;
  }

  public buildWeekKey(group: GroupInformation, week: number): string {
    return this.buildWeeksKey(group) + ":" + week;
  }

  public updateGlobalCacheInfo(group: GroupInformation) {
    return ScheduleCache.updateGlobalGroupInfo(group);
  }
}
