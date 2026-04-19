import type { GroupInformation, ScheduleWeeks, WatcherData } from '../schedule/types';

import { CACHE_FILE_NAME, TWO_HOURS_MS } from '../schedule/constants';
import { Cache } from './cache';

import { join } from 'path';

export class ScheduleCache {
  private readonly weeksCache: Cache<ScheduleWeeks>;
  private readonly watcherCache: Cache<WatcherData[string]>;

  public constructor() {
    this.weeksCache = new Cache<ScheduleWeeks>(CACHE_FILE_NAME, join(CACHE_FILE_NAME, "weeks"));
    this.watcherCache = new Cache<WatcherData[string]>(CACHE_FILE_NAME, join(CACHE_FILE_NAME, "wather"));
  }

  public async loadAll(): Promise<void> {
    await Promise.all([
      this.weeksCache.load(),
      this.watcherCache.load(),
    ]);
  }

  public async saveAll(): Promise<void> {
    await Promise.all([
      this.weeksCache.save(),
      this.watcherCache.save(),
    ]);
  }

  private buildWeeksKey(group: GroupInformation): string {
    return `${group.course}:${group.specialization}:${group.group}`;
  }

  public getWeeks(group: GroupInformation): ScheduleWeeks | undefined {
    const key = this.buildWeeksKey(group);
    return this.weeksCache.get(key);
  }

  public setWeeks(group: GroupInformation, weeks: ScheduleWeeks, ttlMs: number = TWO_HOURS_MS): void {
    const key = this.buildWeeksKey(group);
    this.weeksCache.set(key, weeks, ttlMs);
  }

  public getAllCachedGroupKeys(): string[] {
    return this.weeksCache.keys();
  }

  public getWatcherData(): WatcherData {
    const entries = this.watcherCache.entries();
    return Object.fromEntries(entries) as WatcherData;
  }

  public updateWatcherEntry(
    groupKey: string,
    entry: Partial<WatcherData[string]>,
    ttlMs?: number,
  ): void {
    const current = this.watcherCache.get(groupKey) ?? {
      fileId: '',
      lastModified: '',
      lastChecked: '',
    };
    const updated = { ...current, ...entry };
    this.watcherCache.set(groupKey, updated, ttlMs);
  }

  public deleteWatcherEntry(groupKey: string): void {
    this.watcherCache.delete(groupKey);
  }
}