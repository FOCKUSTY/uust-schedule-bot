import type { FileInfo, ExcelSheetInfo } from "./google";

export interface GroupInformation {
  course: string;
  specialization: string;
  group: string;
}

export interface ScheduleDay {
  dayName: string;
  pairs: Record<number, string | null>;
}

export interface ScheduleWeek {
  weekNumber: number;
  days: Record<string, ScheduleDay>;
}

export type ScheduleWeeks = Record<string, ScheduleWeek>;

export interface FormattedSchedule {
  groupName: string;
  weeks: ScheduleWeeks;
}

export interface CacheData {
  default: Record<
    string, // course
    Record<
      string, // specialization
      Record<
        string, // group
        {
          weeks: ScheduleWeeks;
          expiresAt: string; // ISO
        }
      >
    >
  >;
  other: Record<string, unknown>;
}

export type DateLike = Date | string | number;

export interface WatcherEntry {
  fileId: string;
  lastModified: string;   // ISO
  lastChecked: string;    // ISO
}

export interface WatcherData {
  [groupKey: string]: WatcherEntry;
}

export interface CacheData {
  default: Record<
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
  other: Record<string, unknown>;
  watcher: WatcherData;
}