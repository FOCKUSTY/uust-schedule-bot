import { join } from "node:path";

import type {
  GroupInformation,
  ScheduleWeeks,
  WatcherData,
} from "../schedule/types";

import { Cache } from "./cache";
import { CACHE_FILE_NAME, TWO_HOURS_MS } from "./constants";

export class ScheduleCache {
  private readonly weeksCache: Cache;
  private readonly watcherCache: Cache;

  public constructor() {
    this.weeksCache = new Cache(
      CACHE_FILE_NAME,
      join(CACHE_FILE_NAME, "weeks"),
      2000,
    );
    this.watcherCache = new Cache(
      CACHE_FILE_NAME,
      join(CACHE_FILE_NAME, "watcher"),
      2000,
    );
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
    return this.weeksCache.get<ScheduleWeeks>(key);
  }

  public async setWeeks(
    group: GroupInformation,
    weeks: ScheduleWeeks,
    ttlMs: number = TWO_HOURS_MS,
  ): Promise<void> {
    const key = this.buildWeeksKey(group);
    await this.weeksCache.set(key, weeks, ttlMs);
    // Автосохранение запустится внутри Cache.set
  }

  public async getAllCachedGroupKeys(): Promise<string[]> {
    return this.weeksCache.keys();
  }

  public async getWatcherData(): Promise<WatcherData> {
    const entries = await this.watcherCache.keys();
    const result: WatcherData = {};
    for (const key of entries) {
      const value = await this.watcherCache.get(key);
      if (value) {
        result[key] = value as WatcherData[string];
      }
    }
    return result;
  }

  public async updateWatcherEntry(
    groupKey: string,
    entry: Partial<WatcherData[string]>,
    ttlMs?: number,
  ): Promise<void> {
    const current = (await this.watcherCache.get(groupKey)) ?? {
      fileId: "",
      lastModified: "",
      lastChecked: "",
    };
    const updated = { ...current, ...entry };
    await this.watcherCache.set(groupKey, updated, ttlMs);
  }

  public async deleteWatcherEntry(groupKey: string): Promise<void> {
    await this.watcherCache.delete(groupKey);
  }

  private buildWeeksKey(group: GroupInformation): string {
    return `${group.course}:${group.specialization}:${group.group}`;
  }
}
