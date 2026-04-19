import type { ScheduleWeeks, WatcherData } from "../schedule";

export interface CacheData {
  schedule: Record<
    string, // course
    Record<
      string, // specialization
      Record<
        string, // group
        {
          weeks: ScheduleWeeks;
          expiresAt: string;
        }
      >
    >
  >;
  watcher: WatcherData;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

export interface SerializedCache<T = unknown> {
  value: T;
  expiresAt?: string;
}